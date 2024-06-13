import axios from "axios";
import { NET_WORK_CONFIG_V2 } from "../constant/storageKey";
import { getRealErrorMsg } from "../utils/utils";
import { extGetLocal } from "./extensionStorage";
import axiosRetry from "axios-retry";

const TIMEOUT_DURATION = 60000;
const RETRY_TIME = 3;
const RETRY_DELAY_TIME = 1000;

axiosRetry(axios, {
  retries: RETRY_TIME,
  retryDelay: (retryCount) => {
    console.log(`Retrying request, attempt ${retryCount}`);
    return RETRY_DELAY_TIME;
  },
  retryCondition: (error) => {
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

async function getNowUrl() {
  let localNetConfig = await extGetLocal(NET_WORK_CONFIG_V2);
  let url = "";
  if (localNetConfig) {
    url = localNetConfig.currentNode?.url || "";
  }
  return url;
}

async function fetchGraphQL(graphQLBody, variables, url) {
  const fetchUrl = url || (await getNowUrl());
  try {
    const response = await axios.post(
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

export async function startFetchMyQuery(gqlparams, variables = {}, url) {
  let result = await fetchGraphQL(gqlparams, variables, url).catch(
    (errors) => errors
  );
  let { errors, data } = result;
  if (errors) {
    const errMessage = getRealErrorMsg(errors);
    return { error: errMessage };
  }
  return data;
}

export async function startFetchMyMutation(gqlparams, variables = {}, url) {
  const result = await fetchGraphQL(gqlparams, variables, url).catch(
    (errors) => errors
  );
  const { errors, data } = result;
  if (errors) {
    const errMessage = getRealErrorMsg(errors);
    return { error: errMessage };
  }
  return data;
}

export async function commonFetch(url) {
  try {
    const response = await axios.get(url, { timeout: TIMEOUT_DURATION });
    return response.data;
  } catch (error) {
    return { error };
  }
}
export async function postRequest(url, data) {
  try {
    const response = await axios.post(url, data, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: TIMEOUT_DURATION, 
    });
    return response.data;
  } catch (error) {
    console.error("There was an error!", error);
    return { error };
  }
}
