(function () {
  const calendarEl = document.querySelector("[data-calendar]");
  if (!calendarEl) {
    return;
  }

  const solarEl = document.querySelector("[data-calendar-solar]");
  const lunarEl = document.querySelector("[data-calendar-lunar]");
  const holidayEl = document.querySelector("[data-calendar-holiday]");
  const solarFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  function getDateParts(date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  function toISODate(date) {
    const parts = getDateParts(date);
    const month = String(parts.month).padStart(2, "0");
    const day = String(parts.day).padStart(2, "0");
    return `${parts.year}-${month}-${day}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function getSolar(date) {
    if (!window.Solar) {
      return null;
    }
    const parts = getDateParts(date);
    return window.Solar.fromYmd(parts.year, parts.month, parts.day);
  }

  function getHoliday(date) {
    if (!window.HolidayUtil) {
      return null;
    }
    const parts = getDateParts(date);
    return window.HolidayUtil.getHoliday(parts.year, parts.month, parts.day);
  }

  function getLunar(date) {
    const solar = getSolar(date);
    return solar ? solar.getLunar() : null;
  }

  function formatLunarMonth(monthText) {
    return monthText.endsWith("月") ? monthText : `${monthText}月`;
  }

  function getLunarLabel(date) {
    const lunar = getLunar(date);
    if (!lunar) {
      return "农历数据暂不可用";
    }
    const jieQi = lunar.getJieQi();
    const suffix = jieQi ? ` · ${jieQi}` : "";
    return `农历${formatLunarMonth(lunar.getMonthInChinese())}${lunar.getDayInChinese()} · ${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年${suffix}`;
  }

  function getLunarDayShort(date) {
    const solar = getSolar(date);
    if (!solar) {
      return "";
    }
    const lunar = solar.getLunar();
    const solarFestivals = solar.getFestivals ? solar.getFestivals() : [];
    const lunarFestivals = lunar.getFestivals ? lunar.getFestivals() : [];
    const jieQi = lunar.getJieQi();
    if (lunarFestivals.length > 0) {
      return lunarFestivals[0];
    }
    if (solarFestivals.length > 0) {
      return solarFestivals[0];
    }
    if (jieQi) {
      return jieQi;
    }
    if (lunar.getDay() === 1) {
      return formatLunarMonth(lunar.getMonthInChinese());
    }
    return lunar.getDayInChinese();
  }

  function getHolidayLabel(date) {
    const holiday = getHoliday(date);
    if (!holiday) {
      return "法定节假日：无";
    }
    if (holiday.isWork()) {
      return `调休工作日：${holiday.getName()}`;
    }
    return `法定节假日：${holiday.getName()}`;
  }

  function updateToday() {
    const today = new Date();
    if (solarEl) {
      solarEl.textContent = solarFormatter.format(today);
      solarEl.setAttribute("datetime", toISODate(today));
    }
    if (lunarEl) {
      lunarEl.textContent = getLunarLabel(today);
    }
    if (holidayEl) {
      holidayEl.textContent = getHolidayLabel(today);
    }
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function buildHolidayEvents(start, end) {
    const events = [];
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor < last) {
      const holiday = getHoliday(cursor);
      if (holiday) {
        const isWorkday = holiday.isWork();
        events.push({
          title: isWorkday ? `${holiday.getName()} 调休` : holiday.getName(),
          start: toISODate(cursor),
          allDay: true,
          classNames: [isWorkday ? "calendar-workday" : "calendar-holiday"],
          extendedProps: {
            detail: `${holiday.getDay()} ${holiday.getName()}${isWorkday ? " 调休" : ""}，对应日期 ${holiday.getTarget()}`
          }
        });
      }
      cursor = addDays(cursor, 1);
    }
    return events;
  }

  function initCalendar() {
    updateToday();

    if (!window.FullCalendar) {
      calendarEl.textContent = "日历库加载失败，请稍后刷新。";
      return;
    }

    const calendar = new window.FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "zh-cn",
      firstDay: 1,
      height: "auto",
      fixedWeekCount: false,
      dayMaxEvents: 3,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,listMonth"
      },
      buttonText: {
        today: "今日",
        month: "月",
        list: "列表"
      },
      dayCellContent: function (arg) {
        const dayNumber = escapeHtml(arg.dayNumberText.replace("日", ""));
        const lunarDay = escapeHtml(getLunarDayShort(arg.date));
        return {
          html: `<span class="calendar-day-number">${dayNumber}</span><span class="calendar-lunar-day">${lunarDay}</span>`
        };
      },
      events: function (info, successCallback) {
        successCallback(buildHolidayEvents(info.start, info.end));
      },
      eventDidMount: function (info) {
        if (info.event.extendedProps.detail) {
          info.el.setAttribute("title", info.event.extendedProps.detail);
        }
      }
    });

    calendar.render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalendar);
  } else {
    initCalendar();
  }
})();
