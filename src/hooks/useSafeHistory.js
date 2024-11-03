import { useHistory } from "react-router-dom";

function useSafeHistory(inOutRouter = false) {
  if (inOutRouter) {
    return null;
  }
  try {
    return useHistory();
  } catch (error) {
    console.warn(
      "useHistory is not available outside of a Router context. Please provide a preHistory prop."
    );
    return null;
  }
}

export default useSafeHistory;
