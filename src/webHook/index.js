import MinaProvider from "@aurowallet/mina-provider";
const provider = new MinaProvider();
const info = {
  slug: "aurowallet",
  name: "Auro Wallet",
  icon: "https://www.aurowallet.com/imgs/auro.png",
  rdns: "com.aurowallet",
};
window.mina = provider;
const announceProvider = () => {
  window.dispatchEvent(
    new CustomEvent("mina:announceProvider", {
      detail: Object.freeze({ info, provider }),
    }),
  );
};
window.addEventListener("mina:requestProvider", (event) => {
  announceProvider();
});
console.log('Auro Wallet initialized.');
announceProvider();
