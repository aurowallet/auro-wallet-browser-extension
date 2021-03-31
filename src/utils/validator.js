import bs58check from "bs58check";

export const matchList = [
  {
    text: ('atLeastOneNumber'),
    expression: /[0-9]+/,
    bool: false
  },
  {
    text: ('atLeastOneLowercaseLetter'),
    expression: /[a-z]+/,
    bool: false
  },
  {
    text: ('atLeastOneUppercaseLetter'),
    expression: /[A-Z]+/,
    bool: false
  },
  {
    text: ('passwordRequires'),
    expression: /.{8,32}/,
    bool: false
  },
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
 * 校验地址是否有效
 * @param {*} address 
 */
export function addressValid(address) {
  try {
    const decodedAddress = bs58check.decode(address).toString('hex');
    return !!decodedAddress && decodedAddress.length === 72;
  } catch (ex) {
    return false
  }
}