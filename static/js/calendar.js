// Solar and lunar calendar widget for the homepage.
(function () {
  const lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  const monthNames = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
  const dayNames = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const zodiac = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const festivals = {
    "1-1": "春节",
    "1-15": "元宵",
    "5-5": "端午",
    "7-7": "七夕",
    "8-15": "中秋",
    "9-9": "重阳",
    "12-8": "腊八",
    "12-23": "小年"
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function utcDate(year, month, day) {
    return Date.UTC(year, month, day);
  }

  function leapMonth(year) {
    return lunarInfo[year - 1900] & 0xf;
  }

  function leapDays(year) {
    if (!leapMonth(year)) return 0;
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
  }

  function monthDays(year, month) {
    return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
  }

  function yearDays(year) {
    let total = 348;
    for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
      if (lunarInfo[year - 1900] & bit) total += 1;
    }
    return total + leapDays(year);
  }

  function solarToLunar(date) {
    let offset = Math.floor((utcDate(date.getFullYear(), date.getMonth(), date.getDate()) - utcDate(1900, 0, 31)) / 86400000);
    let year = 1900;
    let temp = 0;

    if (offset < 0 || date.getFullYear() > 2100) return null;

    for (; year < 2101 && offset > 0; year += 1) {
      temp = yearDays(year);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      year -= 1;
    }

    const leap = leapMonth(year);
    let isLeap = false;
    let month = 1;

    for (; month < 13 && offset > 0; month += 1) {
      if (leap > 0 && month === leap + 1 && !isLeap) {
        month -= 1;
        isLeap = true;
        temp = leapDays(year);
      } else {
        temp = monthDays(year, month);
      }

      if (isLeap && month === leap + 1) isLeap = false;
      offset -= temp;
    }

    if (offset === 0 && leap > 0 && month === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        month -= 1;
      }
    }

    if (offset < 0) {
      offset += temp;
      month -= 1;
    }

    return {
      year,
      month,
      day: offset + 1,
      isLeap
    };
  }

  function lunarMonthName(lunar) {
    return `${lunar.isLeap ? "闰" : ""}${monthNames[lunar.month - 1]}`;
  }

  function lunarYearName(year) {
    return `${stems[(year - 4) % 10]}${branches[(year - 4) % 12]}${zodiac[(year - 4) % 12]}年`;
  }

  function lunarLabel(lunar) {
    if (!lunar) return "农历";
    const key = `${lunar.month}-${lunar.day}`;
    if (!lunar.isLeap && festivals[key]) return festivals[key];
    return lunar.day === 1 ? lunarMonthName(lunar) : dayNames[lunar.day - 1];
  }

  function formatSolar(date) {
    return `阳历 ${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${weekdays[date.getDay()]}`;
  }

  function formatLunar(lunar) {
    if (!lunar) return "农历日期暂不可用";
    return `农历 ${lunarYearName(lunar.year)} ${lunarMonthName(lunar)}${dayNames[lunar.day - 1]}`;
  }

  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function render(root, activeDate) {
    const today = new Date();
    const solarEl = root.querySelector("[data-calendar-solar]");
    const lunarEl = root.querySelector("[data-calendar-lunar]");
    const monthEl = root.querySelector("[data-calendar-month]");
    const gridEl = root.querySelector("[data-calendar-grid]");
    const first = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());

    solarEl.textContent = formatSolar(today);
    solarEl.setAttribute("datetime", `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    lunarEl.textContent = formatLunar(solarToLunar(today));
    monthEl.textContent = `${activeDate.getFullYear()}年${pad(activeDate.getMonth() + 1)}月`;

    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const lunar = solarToLunar(date);
      const label = lunarLabel(lunar);
      const classNames = ["calendar-day"];
      const lunarClassNames = ["calendar-lunar-day"];

      if (date.getMonth() !== activeDate.getMonth()) classNames.push("is-outside");
      if (sameDate(date, today)) classNames.push("is-today");
      if (lunar && !lunar.isLeap && festivals[`${lunar.month}-${lunar.day}`]) lunarClassNames.push("is-festival");

      cells.push(`
        <div class="${classNames.join(" ")}">
          <span class="calendar-solar-day">${date.getDate()}</span>
          <span class="${lunarClassNames.join(" ")}">${label}</span>
        </div>
      `);
    }

    gridEl.innerHTML = cells.join("");
  }

  function initCalendar(root) {
    let activeDate = new Date();
    activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);

    root.querySelector("[data-calendar-prev]").addEventListener("click", function () {
      activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1);
      render(root, activeDate);
    });

    root.querySelector("[data-calendar-next]").addEventListener("click", function () {
      activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1);
      render(root, activeDate);
    });

    root.querySelector("[data-calendar-today]").addEventListener("click", function () {
      const today = new Date();
      activeDate = new Date(today.getFullYear(), today.getMonth(), 1);
      render(root, activeDate);
    });

    render(root, activeDate);
  }

  function init() {
    document.querySelectorAll("[data-calendar]").forEach(initCalendar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
