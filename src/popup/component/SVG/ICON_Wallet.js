function ICON_Wallet({ fill, stroke }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4.75"
        y="6.75"
        width="20.5"
        height="16.5"
        rx="2.25"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path
        d="M15.75 15C15.75 13.2051 17.2051 11.75 19 11.75H25.25V18.25H19C17.2051 18.25 15.75 16.7949 15.75 15Z"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="19" cy="15" r="1" fill={stroke} />
    </svg>
  );
}
export default ICON_Wallet;
