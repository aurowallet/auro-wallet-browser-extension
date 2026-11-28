import browser from "webextension-polyfill";
import { LANGUAGE_CONFIG } from "@/constant/storageKey";
import { WORKER_ACTIONS } from "@/constant/msgTypes";
import { memStore } from "@/store";
import { getCurrentNodeConfig } from "@/utils/browserUtils";
import {
  closePopupWindow,
  startExtensionPopup,
  startPopupWindow,
} from "@/utils/popup";
import { isTrustedBuildOrigin } from "@/utils/utils";
import type {
  ILocalTransferJob,
  ILocalTransferRequest,
  ILocalTransferSummary,
} from "@/types/nft";
import { TOKEN_BUILD_URL } from "../../config";

export interface INFTBuildResult {
  buildID: string;
  kind: string;
  protocol: string;
  event: string;
  transaction?: Record<string, any>;
}

type CancelRequest = Pick<
  ILocalTransferRequest,
  "chain" | "sender" | "collectionAddress" | "nftAddress"
> & { jobId?: string };

function matchesContext(
  summary: ILocalTransferSummary,
  node: Awaited<ReturnType<typeof getCurrentNodeConfig>>,
) {
  const store = memStore.getState();
  return (
    store.isUnlocked &&
    store.currentAccount.address === summary.sender &&
    node.networkID === summary.chain &&
    node.url === summary.gqlUrl
  );
}

async function checkContext(summary: ILocalTransferSummary) {
  if (!matchesContext(summary, await getCurrentNodeConfig())) {
    throw new Error("Account or network changed");
  }
}

class NFTWebBuild {
  private get jobs() {
    return memStore.getState().nftBuildList;
  }

  private getJob(id: string) {
    const job = Object.hasOwn(this.jobs, id) ? this.jobs[id] : undefined;
    if (!job) throw new Error("NFT build unavailable");
    return job;
  }

  private save(job: ILocalTransferJob) {
    memStore.updateState({ nftBuildList: { ...this.jobs, [job.jobId]: job } });
  }

  private remove(id: string, closeWindow = true) {
    const jobs = { ...this.jobs };
    delete jobs[id];
    memStore.updateState({ nftBuildList: jobs });
    if (closeWindow) closePopupWindow("nftSign_" + id);
  }

  hasJob(id: string): boolean {
    return Object.hasOwn(this.jobs, id);
  }

  private getBuild(id: string, origin: string, tabId?: number) {
    if (!isTrustedBuildOrigin(origin, TOKEN_BUILD_URL))
      throw new Error("Unexpected NFT builder");
    const job = this.getJob(id);
    if (
      tabId === undefined ||
      tabId !== job.tabId ||
      (job.state !== "queued" && job.state !== "proving")
    ) {
      throw new Error("NFT build unavailable");
    }
    return job;
  }

  async getParams(id: string, origin: string, tabId?: number) {
    const job = this.getBuild(id, origin, tabId);
    return {
      kind: "nft",
      protocol: "auro-nft-web-v1",
      buildID: id,
      gqlUrl: job.summary.gqlUrl,
      networkID: job.chain,
      summary: job.summary,
    };
  }

  async result(input: INFTBuildResult, origin: string, tabId?: number) {
    const job = this.getBuild(input.buildID, origin, tabId);
    if (input.protocol !== "auro-nft-web-v1" || input.kind !== "nft") {
      throw new Error("Invalid NFT build result");
    }
    switch (input.event) {
      case "progress":
        this.save({ ...job, state: "proving" });
        break;
      case "result": {
        if (!input.transaction) throw new Error("Missing NFT transaction");
        this.save({ ...job, state: "ready", transaction: input.transaction });
        const message = {
          action: WORKER_ACTIONS.BUILD_NFT_SEND,
          payload: { jobId: job.jobId },
        };
        const notify = () =>
          browser.runtime.sendMessage(message).catch(() => undefined);
        if ((await notify()) !== true) {
          await startExtensionPopup(true);
          await notify();
        }
        break;
      }
      case "cancel":
      case "error":
        this.remove(job.jobId, false);
        break;
      default:
        throw new Error("Invalid NFT build result");
    }
    return { accepted: true };
  }

  async create(summary: ILocalTransferSummary) {
    const language = (await browser.storage.local.get(LANGUAGE_CONFIG))[
      LANGUAGE_CONFIG
    ];
    const jobId = Array.from(crypto.getRandomValues(new Uint8Array(24)), (n) =>
      n.toString(16).padStart(2, "0"),
    ).join("");
    const url = new URL(TOKEN_BUILD_URL);
    url.pathname = language ? `/${language}/nft` : "/nft";
    url.search = new URLSearchParams({ buildid: jobId }).toString();
    url.hash = "";
    this.cancel(summary);
    const job: ILocalTransferJob = {
      jobId,
      chain: summary.chain,
      summary,
      state: "queued",
      createdAt: Date.now(),
    };
    this.save(job);
    try {
      const windowId = await startPopupWindow(
        "about:blank",
        "nftSign_" + jobId,
      );
      if (windowId === undefined) throw new Error("Could not open NFT builder");
      const [tab] = await browser.tabs.query({ windowId });
      if (!this.hasJob(jobId) || tab?.id === undefined)
        throw new Error("NFT build unavailable");
      job.tabId = tab.id;
      this.save(job);
      await browser.tabs.update(tab.id, { url: url.href });
      return job;
    } catch (error) {
      this.remove(jobId);
      throw error;
    }
  }

  async pending() {
    const node = await getCurrentNodeConfig();
    return Object.values(this.jobs)
      .filter(
        (job) => job.state === "ready" && matchesContext(job.summary, node),
      )
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((job) => job.jobId);
  }

  async review(id: string) {
    await checkContext(this.getJob(id).summary);
    const job = this.getJob(id);
    if (job.state !== "ready" || !job.transaction)
      throw new Error("NFT build unavailable");
    closePopupWindow("nftSign_" + id);
    return job;
  }

  cancel(request: CancelRequest) {
    const ids = Object.values(this.jobs)
      .filter(
        (job) =>
          (!request.jobId || job.jobId === request.jobId) &&
          job.summary.chain === request.chain &&
          job.summary.sender === request.sender &&
          job.summary.collectionAddress === request.collectionAddress &&
          job.summary.nftAddress === request.nftAddress,
      )
      .map((job) => job.jobId);
    ids.forEach((id) => this.remove(id));
    return { cancelled: true, jobIds: ids };
  }

  async removeBuild(id: string) {
    await checkContext(this.getJob(id).summary);
    if (this.getJob(id).state !== "ready")
      throw new Error("NFT build unavailable");
    this.remove(id);
    return { removed: true };
  }

  async handle(route: string, body: any) {
    switch (route) {
      case "nft/transfer":
        return this.create(body);
      case "transaction/pending":
        return this.pending();
      case "transaction/review":
        return this.review(body.jobId);
      case "transaction/cancel":
        return this.cancel(body);
      case "nft/remove-build":
        return this.removeBuild(body.jobId);
      default:
        throw new Error("Unknown NFT operation");
    }
  }
}

export const nftWebBuild = new NFTWebBuild();
