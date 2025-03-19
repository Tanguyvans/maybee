const styles = {
  //  Colors
  PrimaryColor: "#312E2A",
  SecondaryColor: "#C59F71",

  //  Heading
  HeadText: "text-[30px] font-[700] text-[#312E2A] font-dmsans",

  DiasabledText: {
    color: "rgba(97, 97, 97, 0.30)",
  },
  //  Image
  nftImage: "rouded-xl",

  // light gray container
  lightGray: {
    background: "rgba(97, 97, 97, 0.10)",
  },

  //  diabled butoon background
  disabledBackground: {
    background: "rgba(49, 46, 42, 0.10)",
  },

  //  Box-Shadows
  boxShadowofImage: {
    borderRadius: "12px",
    boxShadow: "0px 11px 17px -7px rgba(154, 130, 97, 0.25)",
  },
  boxShadowForButton: {
    // boxShadow: "1px 3.5px 0px 0px #312E2A",
  },
  boxShadowForDisableButton: {
    boxShadow: "1px 3.5px 0px 0px #D9D9D7",
  },

  //  Buttons
  primaryButton:
    "bg-white rounded-full border-[1px] shadow-[1px_3.5px_0px_0px_#312E2A] hover:shadow-none border-[#312E2A] bg-brown-300 shadow-normal  text-[#312E2A] font-semibold transition-transform  hover:translate-x-px hover:translate-y-px @apply transition-all duration-[0.2s] ease-[ease-in-out]  hover:shadow-hover font-dmsans font-medium",
  secondaryButton:
    " bg-[#C59F71] rounded-full border-[1px] border-[#312E2A] bg-brown-300 shadow-normal font-semibold  text-white transition-transform hover:translate-x-px hover:translate-y-px @apply transition-all duration-[0.2s] ease-[ease-in-out];  hover:shadow-hover   font-dmsans",
  disableButton:
    " rounded-full border-[1px] border-[#D9D9D7]  shadow-normal  text-[16px] font-[700]   font-dmsans cursor-not-allowed",
};

export { styles };
