export const matchList = [
  {
    text: ('passwordRequires'),
    expression: /.{8,32}/,
    bool: false
  },
  {
    text: ('atLeastOneUppercaseLetter'),
    expression: /[A-Z]+/,
    bool: false
  },
  {
    text: ('atLeastOneLowercaseLetter'),
    expression: /[a-z]+/,
    bool: false
  },
  {
    text: ('atLeastOneNumber'),
    expression: /[0-9]+/,
    bool: false
  }
]

/**
 * pwd validate  must gt 8
 */
export function pwdValidate(pwd) {
  let list = matchList.map(v => {
    if (v.expression.test(pwd)) {
      v.bool = true;
    } else {
      v.bool = false;
    }
    return v;
  })
  return list
}
/**
 * pwd confirm input
 */
export function pwdConfirmValidate(pwd, confirmPwd) {
  let realPwd = pwd.replace(/(^\s*)|(\s*$)/g, "");
  let realConfirmPwd = confirmPwd.replace(/(^\s*)|(\s*$)/g, "");
  return realPwd === realConfirmPwd
}

/**
 * Check if the address is valid
 * @param {*} address 
 */
export function addressValid(address) {
  return /^B62[1-9A-HJ-NP-Za-km-z]{52}$/.test(address);
}
