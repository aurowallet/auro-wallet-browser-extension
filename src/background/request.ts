import axios, { AxiosError } from "axios";
import { NET_WORK_CONFIG_V2 } from "../constant/storageKey";
import { getRealErrorMsg } from "../utils/utils";
import { extGetLocal } from "./extensionStorage";
import axiosRetry from "axios-retry";

// ============ Constants ============

const TIMEOUT_DURATION = 60000;
const RETRY_TIME = 3;
const RETRY_DELAY_TIME = 1000;

// ============ Types ============

interface NetworkConfig {
  currentNode?: {
    url?: string;
  };
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: unknown;
}

interface FetchResult<T = unknown> {
  error?: string;
  data?: T;
}

// ============ Setup ============

axiosRetry(axios, {
  retries: RETRY_TIME,
  retryDelay: (retryCount: number) => {
    console.log(`Retrying request, attempt ${retryCount}`);
    return RETRY_DELAY_TIME;
  },
  retryCondition: (error: AxiosError) => {
    const shouldRetry =
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      error.code === "ECONNABORTED";
    if (shouldRetry) {
      console.log(
        `Retrying due to ${error.code || error.response?.status || "timeout"}`
      );
    }
    return shouldRetry;
  },
});

// ============ Internal Functions ============

async function getNowUrl(): Promise<string> {
  const localNetConfig = (await extGetLocal(NET_WORK_CONFIG_V2)) as NetworkConfig | null;
  let url = "";
  if (localNetConfig) {
    url = localNetConfig.currentNode?.url || "";
  }
  return url;
}

async function fetchGraphQL<T = unknown>(
  graphQLBody: string,
  variables: Record<string, unknown>,
  url?: string
): Promise<GraphQLResponse<T>> {
  const fetchUrl = url || (await getNowUrl());
  try {
    const response = await axios.post<GraphQLResponse<T>>(
      fetchUrl,
      {
        query: graphQLBody,
        variables,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: TIMEOUT_DURATION,
      }
    );
    return response.data;
  } catch (error) {
    return { errors: error };
  }
}

// ============ Exported Functions ============

export async function startFetchMyQuery<T = unknown>(
  gqlparams: string,
  variables: Record<string, unknown> = {},
  url?: string
): Promise<T | FetchResult<T>> {
  const result = await fetchGraphQL<T>(gqlparams, variables, url).catch(
    (errors) => ({ errors })
  );
  if ("errors" in result && result.errors) {
    const errMessage = getRealErrorMsg(result.errors);
    return { error: errMessage };
  }
  return (result as GraphQLResponse<T>).data as T;
}

export async function startFetchMyMutation<T = unknown>(
  gqlparams: string,
  variables: Record<string, unknown> = {},
  url?: string
): Promise<T | FetchResult<T>> {
  const result = await fetchGraphQL<T>(gqlparams, variables, url).catch(
    (errors) => ({ errors })
  );
  if ("errors" in result && result.errors) {
    const errMessage = getRealErrorMsg(result.errors);
    return { error: errMessage };
  }
  return (result as GraphQLResponse<T>).data as T;
}

export async function commonFetch<T = unknown>(
  url: string
): Promise<T | { error: unknown }> {
  try {
    const response = await axios.get<T>(url, { timeout: TIMEOUT_DURATION });
    return response.data;
  } catch (error) {
    return { error };
  }
}

export async function postRequest<T = unknown>(
  url: string,
  data: unknown,
  timeout?: number
): Promise<T | { error: unknown }> {
  try {
    const response = await axios.post<T>(url, data, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: timeout || TIMEOUT_DURATION,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error!", error);
    return { error };
  }
}
