export const POWER_BY = "aurowallet.com";

export const lockDuration = {
  dura_1: 5 * 60 * 1000,
  dura_2: 10 * 60 * 1000,
  dura_3: 30 * 60 * 1000,
  dura_4: 1 * 60 * 60 * 1000,
  dura_5: 8 * 60 * 60 * 1000,
  dura_6: -1,
};

export const AUTO_LOCK_TIME_LIST = [
    {
        label:"5 minutes",
        value:lockDuration.dura_1
    },
    {
        label:"10 minutes",
        value:lockDuration.dura_2
    },
    {
        label:"30 minutes",
        value:lockDuration.dura_3
    },
    {
        label:"1 hour",
        value:lockDuration.dura_4
    },
    {
        label:"8 hour",
        value:lockDuration.dura_5
    },
    {
        label:"Never",
        value:lockDuration.dura_6
    }
]