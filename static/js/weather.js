// Lightweight two-day weather widget for the homepage.
(function () {
  const fallbackLocation = {
    name: "Shenzhen, China / 中国深圳",
    latitude: 22.5431,
    longitude: 114.0579
  };

  const weatherText = {
    0: { en: "Clear sky", zh: "晴朗" },
    1: { en: "Mainly clear", zh: "大致晴朗" },
    2: { en: "Partly cloudy", zh: "局部多云" },
    3: { en: "Overcast", zh: "阴天" },
    45: { en: "Fog", zh: "有雾" },
    48: { en: "Depositing rime fog", zh: "雾凇" },
    51: { en: "Light drizzle", zh: "小毛毛雨" },
    53: { en: "Moderate drizzle", zh: "中等毛毛雨" },
    55: { en: "Dense drizzle", zh: "密集毛毛雨" },
    61: { en: "Slight rain", zh: "小雨" },
    63: { en: "Moderate rain", zh: "中雨" },
    65: { en: "Heavy rain", zh: "大雨" },
    71: { en: "Slight snow", zh: "小雪" },
    73: { en: "Moderate snow", zh: "中雪" },
    75: { en: "Heavy snow", zh: "大雪" },
    80: { en: "Slight rain showers", zh: "短时小阵雨" },
    81: { en: "Moderate rain showers", zh: "短时中阵雨" },
    82: { en: "Violent rain showers", zh: "强阵雨" },
    95: { en: "Thunderstorm", zh: "雷暴" },
    96: { en: "Thunderstorm with hail", zh: "雷暴伴冰雹" },
    99: { en: "Thunderstorm with heavy hail", zh: "强冰雹雷暴" }
  };

  const rainCloudIcon = `
    <div class="weather-icon" aria-hidden="true">
      <svg viewBox="0 0 72 56" focusable="false">
        <path d="M24 33.5h29.5a11.5 11.5 0 0 0 1.6-22.9A17.8 17.8 0 0 0 20.9 16 9 9 0 0 0 24 33.5Z"></path>
        <path d="M23 42l-3 7M36 42l-3 7M49 42l-3 7"></path>
      </svg>
    </div>
  `;

  function formatDate(value, index) {
    const label = index === 0 ? "Today / 今日" : "Tomorrow / 明日";
    const date = new Date(`${value}T00:00:00`);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${label} · ${month}-${day}`;
  }

  function formatTemp(max, min) {
    if (typeof max !== "number" || typeof min !== "number") return "-- / --";
    return `${Math.round(min)}°C / ${Math.round(max)}°C`;
  }

  function formatCondition(code) {
    const condition = weatherText[code];
    if (!condition) return "Forecast unavailable / 暂无预报";
    return `${condition.en} / ${condition.zh}`;
  }

  function setStatus(root, message) {
    const updatedEl = root.querySelector("[data-weather-updated]");
    updatedEl.textContent = message;
  }

  function setLocation(root, name) {
    const locationEl = root.querySelector("[data-weather-location]");
    locationEl.textContent = name;
  }

  function renderLoading(root, name) {
    setLocation(root, name);
    setStatus(root, "Loading two-day forecast...");
  }

  function renderWeather(root, location, daily) {
    const daysEl = root.querySelector("[data-weather-days]");

    const rows = daily.time.slice(0, 2).map(function (date, index) {
      const code = daily.weather_code[index];
      const min = daily.temperature_2m_min[index];
      const max = daily.temperature_2m_max[index];
      const rain = daily.precipitation_probability_max[index];
      const rainText = typeof rain === "number" ? ` · Rain / 降雨 ${rain}%` : "";

      return `
        <article class="weather-day">
          ${rainCloudIcon}
          <p class="weather-day-name">${formatDate(date, index)}</p>
          <p class="weather-condition">${formatCondition(code)}</p>
          <p class="weather-temp">${formatTemp(max, min)}${rainText}</p>
        </article>
      `;
    });

    daysEl.innerHTML = rows.join("");
    setLocation(root, location.name);
    setStatus(root, "Updated from Open-Meteo, browser local time. / 数据来自 Open-Meteo，按浏览器本地时间显示。");
  }

  function showFallback(root, message) {
    const daysEl = root.querySelector("[data-weather-days]");
    setStatus(root, message || "Weather is temporarily unavailable.");
    daysEl.innerHTML = `
      <article class="weather-day">
        ${rainCloudIcon}
        <p class="weather-day-name">Today / 今日</p>
        <p class="weather-condition">Unable to load / 暂时无法加载</p>
        <p class="weather-temp">Please check again later. / 请稍后再试。</p>
      </article>
      <article class="weather-day">
        ${rainCloudIcon}
        <p class="weather-day-name">Tomorrow / 明日</p>
        <p class="weather-condition">Unable to load / 暂时无法加载</p>
        <p class="weather-temp">Please check again later. / 请稍后再试。</p>
      </article>
    `;
  }

  async function fetchForecast(location) {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      forecast_days: "2",
      timezone: "auto"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error("Weather request failed");
    const data = await response.json();
    if (!data.daily || !Array.isArray(data.daily.time)) throw new Error("Weather data missing");
    return data.daily;
  }

  async function fetchLocation(query) {
    const params = new URLSearchParams({
      name: query,
      count: "1",
      language: "en",
      format: "json"
    });

    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
    if (!response.ok) throw new Error("Location request failed");
    const data = await response.json();
    if (!data.results || !data.results.length) throw new Error("Location not found");

    const result = data.results[0];
    const region = result.admin1 ? `, ${result.admin1}` : "";
    const country = result.country ? `, ${result.country}` : "";
    return {
      name: `${result.name}${region}${country}`,
      latitude: result.latitude,
      longitude: result.longitude
    };
  }

  async function loadWeather(root, location) {
    renderLoading(root, location.name);
    try {
      const daily = await fetchForecast(location);
      renderWeather(root, location, daily);
    } catch (error) {
      showFallback(root);
    }
  }

  function getCurrentPosition(timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation unavailable"));
        return;
      }

      const timer = window.setTimeout(function () {
        reject(new Error("Geolocation timed out"));
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        function (position) {
          window.clearTimeout(timer);
          resolve(position);
        },
        function (error) {
          window.clearTimeout(timer);
          reject(error);
        },
        {
          enableHighAccuracy: false,
          maximumAge: 30 * 60 * 1000,
          timeout: timeoutMs
        }
      );
    });
  }

  async function loadDefaultWeather(root) {
    try {
      setStatus(root, "Requesting current location... / 正在请求当前位置...");
      const position = await getCurrentPosition(3500);
      await loadWeather(root, {
        name: "Current location / 当前位置",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      await loadWeather(root, fallbackLocation);
    }
  }

  function bindSearch(root) {
    const form = root.querySelector("[data-weather-search]");
    const input = form.querySelector("input");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) return;

      setStatus(root, "Searching location... / 正在查询地区...");
      try {
        const location = await fetchLocation(query);
        await loadWeather(root, location);
      } catch (error) {
        showFallback(root, "Location not found. Try another city or region. / 未找到该地区，请尝试其他城市或地区。");
      }
    });
  }

  function init() {
    document.querySelectorAll("[data-weather]").forEach(function (root) {
      bindSearch(root);
      loadDefaultWeather(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
