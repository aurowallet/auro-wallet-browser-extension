import { DEFAULT_LANGUAGE } from "../constant";

const SET_LANGUAGE = "SET_LANGUAGE"


export function setLanguage(language) {
    return {
        type: SET_LANGUAGE,
        language
    };
}

const initState = {
    language: DEFAULT_LANGUAGE,
};

const appReducer = (state = initState, action) => {
    switch (action.type) {
        case SET_LANGUAGE:
            let language = action.language
            return {
                language,
            };
        default:
            return state;
    }
};

export default appReducer;
