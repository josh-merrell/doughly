/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{html,ts}"],
  mode: "jit",
  purge: ["./src/**/*.{html,ts}"],
  variants: {
    extend: {
      borderWidth: ["hover", "focus"],
      outline: ["focus"],
      opacity: ["responsive", "hover", "focus", "active", "group-hover"],
      display: ["responsive", "hover", "focus", "active", "group-hover"],
      visibility: ["responsive", "hover", "focus", "active", "group-hover"],
      transitionProperty: [
        "responsive",
        "hover",
        "focus",
        "active",
        "group-hover",
      ],
      transitionDuration: [
        "responsive",
        "hover",
        "focus",
        "active",
        "group-hover",
      ],
    },
  },
  theme: {
    fontFamily: {
      sans: ["Poppins", "sans-serif"],
      serif: ['"Noto Serif"', "serif"],
      body: ["Montserrat", "sans-serif"],
    },
    screens: {
      xsm: "500px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
    },
    extend: {
      display: [
        "responseive",
        "group-hover",
        "group-focus",
        "hover",
        "focus",
        "focus-within",
        "!important",
      ],
      spacing: {
        "20%": "20%",
        "50%": "50%",
        "55%": "55%",
        "60%": "60%",
      },
      height: {
        "dl-0": "0rem",
        "dl-1": "0.09375",
        "dl-2": "0.46875rem",
        "dl-2.5": "0.75rem",
        "dl-3": "0.9375rem",
        "dl-3.5": "1.5rem",
        "dl-4": "1.875rem",
        "dl-4.5": "2.25rem",
        "dl-5": "2.8125rem",
        "dl-6": "3.75rem",
        "dl-7": "5.15625rem",
        "dl-8": "6.5625rem",
        "dl-9": "7.96875rem",
        "dl-10": "9.375rem",
        "dl-11": "11.25rem",
        "dl-12": "13.125rem",
        "dl-13": "15rem",
        "dl-14": "16.875rem",
        "dl-15": "18.75rem",
        "dl-16": "21.5625rem",
        "dl-17": "24.375rem",
        "dl-18": "27.1875rem",
        "dl-19": "30rem",
        "dl-20": "32.8125rem",
        "dl-21": "35.625rem",
        "dl-22": "38.4375rem",
        "screen-safe":
          "calc(100vh - env(safe-area-inset-bottom) - env(safe-area-inset-top))",
      },
      maxHeight: {
        "dl-0": "0rem",
        "dl-1": "0.09375",
        "dl-2": "0.46875rem",
        "dl-3": "0.9375rem",
        "dl-3.5": "1.5rem",
        "dl-4": "1.875rem",
        "dl-5": "2.8125rem",
        "dl-6": "3.75rem",
        "dl-7": "5.15625rem",
        "dl-8": "6.5625rem",
        "dl-9": "7.96875rem",
        "dl-10": "9.375rem",
        "dl-11": "11.25rem",
        "dl-12": "13.125rem",
        "dl-13": "15rem",
        "dl-14": "16.875rem",
        "dl-15": "18.75rem",
        "dl-16": "21.5625rem",
        "dl-17": "24.375rem",
        "dl-18": "27.1875rem",
        "dl-19": "30rem",
        "dl-20": "32.8125rem",
        "dl-21": "35.625rem",
        "dl-22": "38.4375rem",
      },
      minHeight: {
        "dl-0": "0rem",
        "dl-1": "0.09375",
        "dl-2": "0.46875rem",
        "dl-3": "0.9375rem",
        "dl-3.5": "1.5rem",
        "dl-4": "1.875rem",
        "dl-5": "2.8125rem",
        "dl-6": "3.75rem",
        "dl-7": "5.15625rem",
        "dl-8": "6.5625rem",
        "dl-9": "7.96875rem",
        "dl-10": "9.375rem",
        "dl-11": "11.25rem",
        "dl-12": "13.125rem",
        "dl-13": "15rem",
        "dl-14": "16.875rem",
        "dl-15": "18.75rem",
        "dl-16": "21.5625rem",
        "dl-17": "24.375rem",
        "dl-18": "27.1875rem",
        "dl-19": "30rem",
        "dl-20": "32.8125rem",
        "dl-21": "35.625rem",
        "dl-22": "38.4375rem",
      },
      width: {
        "dl-0": "0rem",
        "dl-1": "0.09375",
        "dl-2": "0.46875rem",
        "dl-2.5": "0.75rem",
        "dl-3": "0.9375rem",
        "dl-3.5": "1.5rem",
        "dl-4": "1.875rem",
        "dl-5": "2.8125rem",
        "dl-6": "3.75rem",
        "dl-7": "5.15625rem",
        "dl-8": "6.5625rem",
        "dl-9": "7.96875rem",
        "dl-9.5": "8.75rem",
        "dl-10": "9.375rem",
        "dl-11": "11.25rem",
        "dl-12": "13.125rem",
        "dl-13": "15rem",
        "dl-14": "16.875rem",
        "dl-15": "18.75rem",
        "dl-16": "21.5625rem",
        "dl-17": "24.375rem",
        "dl-18": "27.1875rem",
        "dl-19": "30rem",
        "dl-20": "32.8125rem",
        "dl-21": "35.625rem",
        "dl-22": "38.4375rem",
      },
      minWidth: {
        "dl-0": "0rem",
        "dl-1": "0.09375",
        "dl-2": "0.46875rem",
        "dl-3": "0.9375rem",
        "dl-3.5": "1.5rem",
        "dl-4": "1.875rem",
        "dl-5": "2.8125rem",
        "dl-6": "3.75rem",
        "dl-7": "5.15625rem",
        "dl-8": "6.5625rem",
        "dl-9": "7.96875rem",
        "dl-10": "9.375rem",
        "dl-11": "11.25rem",
        "dl-12": "13.125rem",
        "dl-13": "15rem",
        "dl-14": "16.875rem",
        "dl-15": "18.75rem",
        "dl-16": "21.5625rem",
        "dl-17": "24.375rem",
        "dl-18": "27.1875rem",
      },
      maxWidth: {
        "dl-0": "0rem",
        "dl-1": "0.09375",
        "dl-2": "0.46875rem",
        "dl-3": "0.9375rem",
        "dl-3.5": "1.5rem",
        "dl-4": "1.875rem",
        "dl-5": "2.8125rem",
        "dl-6": "3.75rem",
        "dl-7": "5.15625rem",
        "dl-8": "6.5625rem",
        "dl-9": "7.96875rem",
        "dl-10": "9.375rem",
        "dl-11": "11.25rem",
        "dl-12": "13.125rem",
        "dl-13": "15rem",
        "dl-14": "16.875rem",
        "dl-15": "18.75rem",
        "dl-16": "21.5625rem",
        "dl-17": "24.375rem",
        "dl-18": "27.1875rem",
        "dl-19": "30rem",
        "dl-20": "34rem",
        "dl-21": "40rem",
        "dl-22": "46rem",
      },
      borderRadius: {
        "dl-0": "0rem",
        "dl-1": "0.1875rem",
        "dl-2": "0.375rem",
        "dl-3": "0.5625rem",
        "dl-4": "0.75rem",
      },
      margin: {
        "dl-0": "0rem",
        "dl-1": ".1875rem",
        "dl-2": ".375rem",
        "dl-3": ".5625rem",
        "dl-4": ".75rem",
        "dl-5": "1.125rem",
        "dl-6": "1.5rem",
        "dl-7": "2.25rem",
        "dl-8": "3rem",
        "dl-9": "4.5rem",
        "dl-10": "6rem",
        "dl-11": "9rem",
        "dl-12": "12rem",
        "dl-13": "18rem",
        "dl-14": "24rem",
        "dl-15": "36rem",
        "safe-top": "env(safe-area-inset-top)",
        "safe-right": "env(safe-area-inset-right)",
        "safe-bottom": "calc(env(safe-area-inset-bottom))",
      },
      padding: {
        "dl-0": "0rem",
        "dl-1": ".1875rem",
        "dl-1.5": ".2875rem",
        "dl-2": ".375rem",
        "dl-3": ".5625rem",
        "dl-4": ".75rem",
        "dl-5": "1.125rem",
        "dl-6": "1.5rem",
        "dl-7": "2.25rem",
        "dl-8": "3rem",
        "dl-9": "4.5rem",
        "dl-10": "6rem",
        "dl-11": "9rem",
        "dl-12": "12rem",
        "dl-13": "18rem",
        "dl-14": "24rem",
        "dl-15": "36rem",
      },
      lineHeight: {
        "dl-0": 1,
        "dl-1": 1.25,
        "dl-2": 1.5,
        "dl-3": 1.75,
      },
      fontWeight: {
        "dl-1": 300,
        "dl-2": 400,
        "dl-3": 500,
        "dl-4": 700,
      },
      fontSize: {
        "dl-1": "0.5625rem",
        "dl-2": "0.65625rem",
        "dl-3": "0.75rem",
        "dl-4": "0.84375rem",
        "dl-5": "0.9375rem",
        "dl-6": "1.125rem",
        "dl-7": "1.5rem",
        "dl-8": "2.25rem",
        "dl-9": "2.8125rem",
        "dl-10": "3.375rem",
      },
      colors: {
        dl: {
          //primary-old
          "mid-teal-6-to-blue-7": "hsl(174, 73%, 58%)",
          "blue-1": "hsl(204, 96%, 27%)",
          "blue-2": "hsl(203, 87%, 34%)",
          "blue-3": "hsl(202, 83%, 41%)",
          "blue-4": "hsl(201, 79%, 46%)",
          "blue-5": "hsl(199, 84%, 55%)",
          "blue-6": "hsl(197, 92%, 61%)",
          "blue-7": "hsl(196, 94%, 67%)",
          "blue-8": "hsl(195, 97%, 75%)",
          "blue-9": "hsl(195, 100%, 85%)",
          "blue-10": "hsl(195, 100%, 95%)",
          //primary-new
          "green-1": "hsl(86,42%,17%)",
          "green-2": "hsl(82,43%,25%)",
          "green-3": "hsl(77,45%,29%)",
          "green-4": "hsl(70,45%,32%)",
          "green-5": "hsl(65,45%,35%)",
          "green-6": "hsl(59,46%,38%)",
          "green-7": "hsl(53,47%,43%)",
          "green-8": "hsl(53,45%,58%)",
          "green-9": "hsl(52,44%,76%)",
          "green-10": "hsl(52,37%,92%)",
          "yellow-1": "hsl(18,86%,30%)",
          "yellow-2": "hsl(22,75%,37%)",
          "yellow-3": "hsl(26,64%,48%)",
          "yellow-4": "hsl(32,65%,50%)",
          "yellow-5": "hsl(38,70%,53%)",
          "yellow-6": "hsl(43,78%,56%)",
          "yellow-7": "hsl(49,84%,60%)",
          "yellow-8": "hsl(54,80%,67%)",
          "yellow-9": "hsl(58,85%,82%)",
          "yellow-10": "hsl(64,94%,93%)",
          //secondary-old
          "pink-1": "hsl(320, 100%, 19%)",
          "pink-2": "hsl(322, 93%, 27%)",
          "pink-3": "hsl(324, 93%, 33%)",
          "pink-4": "hsl(326, 90%, 39%)",
          "pink-5": "hsl(328, 85%, 46%)",
          "pink-6": "hsl(330, 79%, 56%)",
          "pink-7": "hsl(334, 86%, 67%)",
          "pink-8": "hsl(336, 100%, 77%)",
          "pink-9": "hsl(338, 100%, 86%)",
          "pink-10": "hsl(341, 100%, 95%)",
          "red-1": "hsl(348, 94%, 20%)",
          "red-2": "hsl(350, 94%, 28%)",
          "red-3": "hsl(352, 90%, 35%)",
          "red-4": "hsl(354, 85%, 44%)",
          "red-5": "hsl(356, 75%, 53%)",
          "red-6": "hsl(360, 83%, 62%)",
          "red-7": "hsl(360, 91%, 69%)",
          "red-8": "hsl(360, 100%, 80%)",
          "red-9": "hsl(360, 100%, 97%)",
          "red-10": "hsl(360, 100%, 95%)",
          // "yellow-1": "hsl(15, 86%, 30%)",
          // "yellow-2": "hsl(22, 82%, 39%)",
          // "yellow-3": "hsl(29, 80%, 44%)",
          // "yellow-4": "hsl(36, 77%, 49%)",
          // "yellow-5": "hsl(42, 87%, 55%)",
          // "yellow-6": "hsl(44, 92%, 63%)",
          // "yellow-7": "hsl(48, 94%, 68%)",
          // "yellow-8": "hsl(48, 95%, 76%)",
          // "yellow-9": "hsl(48, 100%, 88%)",
          // "yellow-10": "hsl(48, 100%, 96%)",
          "teal-1": "hsl(170, 97%, 15%)",
          "teal-2": "hsl(168, 80%, 23%)",
          "teal-3": "hsl(166, 72%, 28%)",
          "teal-4": "hsl(164, 71%, 34%)",
          "teal-5": "hsl(162, 63%, 41%)",
          "teal-6": "hsl(160, 51%, 49%)",
          "teal-7": "hsl(158, 58%, 62%)",
          "teal-8": "hsl(156, 73%, 74%)",
          "teal-9": "hsl(154, 75%, 87%)",
          "teal-10": "hsl(152, 68%, 96%)",
          //secondary-new
          "pinknew-1": "hsl(345,58%,25%)",
          "pinknew-2": "hsl(345,57%,37%)",
          "pinknew-3": "hsl(344,57%,48%)",
          "pinknew-4": "hsl(344,60%,59%)",
          "pinknew-5": "hsl(342,60%,68%)",
          "pinknew-6": "hsl(338,58%,75%)",
          "pinknew-7": "hsl(332,56%,79%)",
          "pinknew-8": "hsl(330,51%,83%)",
          "pinknew-9": "hsl(329,49%,87%)",
          "pinknew-10": "hsl(330,39%,93%)",
          //neutral-old
          "grey-1": "hsl(210, 24%, 16%)",
          "grey-2": "hsl(209, 20%, 25%)",
          "grey-3": "hsl(209, 18%, 30%)",
          "grey-4": "hsl(209, 14%, 37%)",
          "grey-5": "hsl(211, 12%, 43%)",
          "grey-6": "hsl(211, 10%, 53%)",
          "grey-7": "hsl(211, 13%, 65%)",
          "grey-8": "hsl(210, 16%, 82%)",
          "grey-9": "hsl(214, 15%, 91%)",
          "grey-10": "hsl(216, 33%, 97%)",
          //neutral-new
          "tan-1": "hsl(36,15%,13%)",
          "tan-2": "hsl(35,13%,23%)",
          "tan-3": "hsl(34,12%,28%)",
          "tan-4": "hsl(38,9%,35%)",
          "tan-5": "hsl(35,8%,48%)",
          "tan-6": "hsl(34,8%,61%)",
          "tan-7": "hsl(35,11%,69%)",
          "tan-8": "hsl(34,15%,80%)",
          "tan-9": "hsl(34,14%,90%)",
          "tan-10": "hsl(45,25%,97%)",
        },
      },
      inset: {
        "-rignt-22": "-5.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwind-scrollbar-hide"),
    require("@tailwindcss/line-clamp")
  ],
};
