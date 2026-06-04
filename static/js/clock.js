// Academic clock widget.
// By default it uses the browser's local time. Set data-timezone on
// the clock root if a fixed IANA timezone is desired, e.g. Asia/Shanghai.
(function () {
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function getParts(timezone) {
    const now = new Date();

    if (!timezone) {
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds()
      };
    }

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    const values = {};
    for (const part of formatter.formatToParts(now)) {
      if (part.type !== "literal") values[part.type] = Number(part.value);
    }
    return {
      year: values.year,
      month: values.month,
      day: values.day,
      hour: values.hour,
      minute: values.minute,
      second: values.second
    };
  }

  function updateClock(root) {
    const timezone = root.dataset.timezone || "";
    const parts = getParts(timezone);
    const dateEl = root.querySelector("[data-clock-date]");
    const timeEl = root.querySelector("[data-clock-time]");
    const hourHand = root.querySelector("[data-hour-hand]");
    const minuteHand = root.querySelector("[data-minute-hand]");
    const secondHand = root.querySelector("[data-second-hand]");

    const dateText = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
    const timeText = `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
    dateEl.textContent = dateText;
    dateEl.setAttribute("datetime", dateText);
    timeEl.textContent = timeText;
    timeEl.setAttribute("datetime", timeText);

    const hourDegree = ((parts.hour % 12) + parts.minute / 60) * 30;
    const minuteDegree = (parts.minute + parts.second / 60) * 6;
    const secondDegree = parts.second * 6;

    hourHand.style.transform = `translateX(-50%) rotate(${hourDegree}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minuteDegree}deg)`;
    secondHand.style.transform = `translateX(-50%) rotate(${secondDegree}deg)`;
  }

  function init() {
    const clocks = document.querySelectorAll("[data-clock]");
    clocks.forEach(function (clock) {
      updateClock(clock);
      window.setInterval(function () {
        updateClock(clock);
      }, 1000);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
