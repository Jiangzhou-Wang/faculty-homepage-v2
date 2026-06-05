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

  function hasChineseText(value) {
    return /[\u3400-\u9fff]/.test(value);
  }

  function normalizeChinesePlace(value) {
    return value
      .trim()
      .replace(/\s+/g, "")
      .replace(/(特别行政区|自治区|地区|盟|自治州|市|县|区|省)$/u, "");
  }

  function createQueryVariants(value) {
    const variants = new Set();
    const trimmed = value.trim();
    const compact = trimmed.replace(/\s+/g, "");
    const normalized = hasChineseText(trimmed) ? normalizeChinesePlace(trimmed) : trimmed;

    [trimmed, compact, normalized].forEach(function (item) {
      if (item) variants.add(item);
    });

    if (hasChineseText(trimmed)) {
      variants.add(compact.replace(/市辖区$/u, ""));
      variants.add(compact.replace(/新区$/u, ""));
      variants.add(compact.replace(/^(中国|中华人民共和国)/u, ""));
      variants.add(normalized.replace(/^(中国|中华人民共和国)/u, ""));
    }

    return Array.from(variants).filter(Boolean);
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
    setStatus(root, "");
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

  function joinAddress(parts, separator) {
    const values = parts.filter(Boolean);
    return Array.from(new Set(values)).join(separator);
  }

  async function fetchReverseAddress(latitude, longitude) {
    const baseUrl = "https://api.bigdatacloud.net/data/reverse-geocode-client";
    const common = {
      latitude: String(latitude),
      longitude: String(longitude)
    };
    const urls = ["en", "zh"].map(function (language) {
      const params = new URLSearchParams({
        ...common,
        localityLanguage: language
      });
      return `${baseUrl}?${params.toString()}`;
    });

    const responses = await Promise.all(urls.map(function (url) {
      return fetch(url);
    }));
    if (responses.some(function (response) { return !response.ok; })) {
      throw new Error("Reverse geocoding failed");
    }

    const english = await responses[0].json();
    const chinese = await responses[1].json();
    const englishName = joinAddress([
      english.locality,
      english.city,
      english.principalSubdivision,
      english.countryName
    ], ", ");
    const chineseName = joinAddress([
      chinese.locality,
      chinese.city,
      chinese.principalSubdivision,
      chinese.countryName
    ], "，");

    if (!englishName && !chineseName) throw new Error("Reverse address missing");
    return `${chineseName || "已定位地区"} / ${englishName || "Located area"}`;
  }

  function formatLocationName(result) {
    const region = result.admin1 ? `, ${result.admin1}` : "";
    const country = result.country ? `, ${result.country}` : "";
    return `${result.name}${region}${country}`;
  }

  function scoreLocation(result, rawQuery, normalizedQuery) {
    const query = rawQuery.replace(/\s+/g, "");
    const fields = [result.name, result.admin1, result.admin2, result.country].filter(Boolean);
    const joined = fields.join("");
    let score = 0;

    if (result.country_code === "CN") score += 40;
    if (result.name === query || result.name === normalizedQuery) score += 80;
    if (joined.includes(query)) score += 120;
    if (joined.includes(normalizedQuery)) score += 60;
    if (result.admin2 && (result.admin2.includes(query) || result.admin2.includes(normalizedQuery))) score += 95;
    if (query.includes(result.name) || normalizedQuery.includes(result.name)) score += 35;
    if (typeof result.population === "number") score += Math.min(30, Math.log10(result.population + 1) * 6);
    if (result.feature_code === "PPLA" || result.feature_code === "PPLA2") score += 20;

    return score;
  }

  async function requestLocations(query, language) {
    const params = new URLSearchParams({
      name: query,
      count: "10",
      language,
      format: "json"
    });

    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
    if (!response.ok) throw new Error("Location request failed");
    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  }

  async function fetchLocation(query) {
    const rawQuery = query.trim();
    const normalizedQuery = hasChineseText(rawQuery) ? normalizeChinesePlace(rawQuery) : rawQuery;
    const queryVariants = createQueryVariants(rawQuery);
    const attempts = hasChineseText(rawQuery)
      ? queryVariants.flatMap(function (item) {
          return [
            { query: item, language: "zh" },
            { query: item, language: "en" }
          ];
        })
      : queryVariants.map(function (item) {
          return { query: item, language: "en" };
        });

    const seen = new Set();
    const results = [];

    for (const attempt of attempts) {
      if (!attempt.query || seen.has(`${attempt.language}:${attempt.query}`)) continue;
      seen.add(`${attempt.language}:${attempt.query}`);
      results.push(...await requestLocations(attempt.query, attempt.language));
    }

    if (!results.length) throw new Error("Location not found");

    const result = results
      .map(function (candidate) {
        return {
          candidate,
          score: scoreLocation(candidate, rawQuery, normalizedQuery)
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })[0].candidate;

    return {
      name: formatLocationName(result),
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
      setStatus(root, "Locating weather area... / 正在定位天气地区...");
      const position = await getCurrentPosition(3500);
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const name = await fetchReverseAddress(latitude, longitude);
      await loadWeather(root, {
        name,
        latitude,
        longitude
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
