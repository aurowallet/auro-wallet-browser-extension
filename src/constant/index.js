export const POWER_BY = "aurowallet.com";
import i18n from "i18next";

const lockDuration = {
  dura_1: 5 * 60 * 1000,
  dura_2: 10 * 60 * 1000,
  dura_3: 30 * 60 * 1000,
  dura_4: 1 * 60 * 60 * 1000,
  dura_5: 8 * 60 * 60 * 1000,
  dura_6: -1,
};

export const AUTO_LOCK_TIME_LIST = [
    {
        label:'lockTime_5m',
        value:lockDuration.dura_1
    },
    {
        label:'lockTime_10m',
        value:lockDuration.dura_2
    },
    {
        label:'lockTime_30m',
        value:lockDuration.dura_3
    },
    {
        label:'lockTime_1h',
        value:lockDuration.dura_4
    },
    {
        label:'lockTime_8h',
        value:lockDuration.dura_5
    },
    {
        label:'lockTime_never',
        value:lockDuration.dura_6
    }
]