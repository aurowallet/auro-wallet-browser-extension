import axios from "axios";
import { NET_WORK_CONFIG } from "../constant/storageKey";
import "./api/axios";
import { getLocal } from "./localStorage";

function getNowUrl() {
  let localNetConfig = getLocal(NET_WORK_CONFIG)
  let url = ""
  if (localNetConfig) {
    localNetConfig = JSON.parse(localNetConfig)
    url = localNetConfig.currentUrl
  }
  return url
}

async function fetchGraphQL(operationsDoc, operationName, variables, url, retryCount = 0) {
  let real = getNowUrl()
  let fetchUrl = real
  return new Promise((resolve, reject) => {
    axios.post(
      fetchUrl,
      {
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      }, {
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json',
      },
    }
    ).then((response) => {
      resolve(response.data)
    })
      .catch(async (err) => {
        reject({ errors: err })
      })
  })
}

export async function startFetchMyQuery(gqlparams, url) {
  let result = await fetchGraphQL(
    gqlparams,
    "MyQuery",
    {},
    url
  ).catch(errors => errors);
  let { errors, data } = result
  if (result.errors) {
    let errMessage = ""
    if (Array.isArray(errors) && errors[0] && errors[0].message) {
      errMessage = errors[0].message
    } else {
      errMessage = JSON.stringify(errors)
    }
    return { error: errMessage }
  }
  return data

}
export async function startFetchMyMutation(gqlparams, url, variables = {}) {
  let result = await fetchGraphQL(
    gqlparams,
    "MyMutation",
    variables,
    url
  ).catch(errors => errors);
  let { errors, data } = result
  if (result.errors) {
    let errMessage = ""
    if (Array.isArray(errors) && errors[0] && errors[0].message) {
      errMessage = errors[0].message
    } else {
      errMessage = JSON.stringify(errors)
    }
    return { error: errMessage }
  }
  return data
}


export async function commonFetch(url) {
  return new Promise((resolve, reject) => {
    axios.get(url).then((response) => {
      resolve(response.data)
    }).catch(error => {
      reject({ error: error })
    })
  })
}