(function () {
  const root = document.querySelector("[data-map]");
  if (!root) {
    return;
  }

  const statusEl = document.querySelector("[data-map-status]");
  const expandButton = document.querySelector("[data-map-expand]");
  const modal = document.querySelector("[data-map-modal]");
  const closeButton = document.querySelector("[data-map-close]");
  const searchForm = document.querySelector("[data-map-search]");
  const routeForm = document.querySelector("[data-map-route]");
  const resultsEl = document.querySelector("[data-map-results]");
  const fullStatusEl = document.querySelector("[data-map-full-status]");
  const previewLabelEl = document.querySelector("[data-map-preview-label]");
  const previewCoordinatesEl = document.querySelector("[data-map-preview-coordinates]");
  const previewLinkEl = document.querySelector("[data-map-preview-link]");
  const fullLabelEl = document.querySelector("[data-map-full-label]");
  const fullCoordinatesEl = document.querySelector("[data-map-full-coordinates]");
  const appleMapLinkEl = document.querySelector("[data-apple-map-open]");
  const appleRouteLinkEl = document.querySelector("[data-apple-route-open]");

  const defaultPosition = {
    lat: Number(root.dataset.defaultLatitude) || 22.5333,
    lng: Number(root.dataset.defaultLongitude) || 113.9304,
    label: root.dataset.defaultLabel || "深圳大学"
  };

  let currentPosition = defaultPosition;
  let destinationPosition = null;
  let routeUrlValue = "";

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function setFullStatus(message) {
    if (fullStatusEl) {
      fullStatusEl.textContent = message;
    }
  }

  function formatCoordinates(position) {
    return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
  }

  function appleMapUrl(position, label) {
    const params = new URLSearchParams({
      ll: `${position.lat},${position.lng}`,
      q: label || position.label || "位置",
      z: "15"
    });
    return `https://maps.apple.com/?${params.toString()}`;
  }

  function appleRouteUrl(start, end) {
    const params = new URLSearchParams({
      saddr: `${start.lat},${start.lng}`,
      daddr: `${end.lat},${end.lng}`,
      dirflg: "d"
    });
    return `https://maps.apple.com/?${params.toString()}`;
  }

  function updateAppleMapLinks() {
    const activePosition = destinationPosition || currentPosition;
    const activeLabel = activePosition.label || "当前位置";
    const mapUrl = appleMapUrl(activePosition, activeLabel);

    if (previewLabelEl) {
      previewLabelEl.textContent = currentPosition.label || "当前位置";
    }
    if (previewCoordinatesEl) {
      previewCoordinatesEl.textContent = formatCoordinates(currentPosition);
    }
    if (previewLinkEl) {
      previewLinkEl.href = appleMapUrl(currentPosition, currentPosition.label);
    }

    if (fullLabelEl) {
      fullLabelEl.textContent = activeLabel;
    }
    if (fullCoordinatesEl) {
      fullCoordinatesEl.textContent = formatCoordinates(activePosition);
    }
    if (appleMapLinkEl) {
      appleMapLinkEl.href = mapUrl;
    }
    if (appleRouteLinkEl) {
      if (routeUrlValue) {
        appleRouteLinkEl.href = routeUrlValue;
        appleRouteLinkEl.hidden = false;
      } else {
        appleRouteLinkEl.hidden = true;
      }
    }
  }

  function updateCurrentPosition(position, label) {
    currentPosition = {
      lat: position.lat,
      lng: position.lng,
      label: label || position.label || "当前位置"
    };
    updateAppleMapLinks();
  }

  function requestLocation() {
    // Apple 地图网页不能跨站嵌入；这里保留定位，并将坐标交给 Apple 地图链接打开。
    if (!navigator.geolocation) {
      setStatus("浏览器不支持定位，已显示默认区域。");
      updateCurrentPosition(defaultPosition, defaultPosition.label);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "当前位置"
        };
        updateCurrentPosition(coords, coords.label);
        setStatus("已定位当前位置，可在 Apple 地图中打开。");
      },
      function () {
        updateCurrentPosition(defaultPosition, defaultPosition.label);
        setStatus("无法读取浏览器定位，已显示默认区域。");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  function requestMapFullscreen() {
    if (!modal || !modal.requestFullscreen) {
      return;
    }
    modal.requestFullscreen().catch(function () {
      setFullStatus("浏览器未允许系统全屏，已使用页面全屏地图入口。");
    });
  }

  function openModal() {
    if (!modal) {
      return;
    }
    modal.hidden = false;
    document.body.classList.add("map-modal-open");
    updateAppleMapLinks();
    setFullStatus("可检索地点、生成导航，并在 Apple 地图中打开。");
    requestMapFullscreen();
  }

  function closeModal() {
    if (!modal) {
      return;
    }
    modal.hidden = true;
    document.body.classList.remove("map-modal-open");
    if (document.fullscreenElement === modal && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function geocodeUrl(query) {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "6",
      addressdetails: "1",
      "accept-language": "zh-CN"
    });
    return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  }

  async function geocode(query) {
    const response = await fetch(geocodeUrl(query), {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("geocode failed");
    }
    const items = await response.json();
    return items.map(function (item) {
      return {
        lat: Number(item.lat),
        lng: Number(item.lon),
        label: item.display_name || query
      };
    }).filter(function (item) {
      return Number.isFinite(item.lat) && Number.isFinite(item.lng);
    });
  }

  function clearResults() {
    if (resultsEl) {
      resultsEl.textContent = "";
    }
  }

  function setDestination(position, label) {
    destinationPosition = {
      lat: position.lat,
      lng: position.lng,
      label: label || position.label || "目的地"
    };
    routeUrlValue = "";
    updateAppleMapLinks();
  }

  function renderResults(results) {
    clearResults();
    if (!resultsEl) {
      return;
    }
    if (results.length === 0) {
      resultsEl.textContent = "未找到匹配地点。";
      return;
    }

    results.forEach(function (result) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-result-button";
      button.textContent = result.label;
      button.addEventListener("click", function () {
        setDestination(result, result.label);
        setFullStatus("已选择目的地，可在 Apple 地图中打开。");
        const routeEnd = routeForm ? routeForm.elements["route-end"] : null;
        if (routeEnd) {
          routeEnd.value = result.label;
        }
      });
      resultsEl.appendChild(button);
    });
  }

  async function resolvePoint(value, fallback) {
    const query = value.trim();
    if (!query) {
      return fallback;
    }
    const results = await geocode(query);
    if (results.length === 0) {
      throw new Error("no place");
    }
    return results[0];
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (!searchForm) {
      return;
    }
    const input = searchForm.elements["map-search-query"];
    const query = input ? input.value.trim() : "";
    if (!query) {
      setFullStatus("请输入地点名称。");
      return;
    }
    setFullStatus("正在检索地点...");
    try {
      const results = await geocode(query);
      renderResults(results);
      setFullStatus(results.length > 0 ? "已返回地点结果。" : "未找到匹配地点。");
    } catch (error) {
      clearResults();
      setFullStatus("地点检索暂时不可用。");
    }
  }

  async function handleRoute(event) {
    event.preventDefault();
    if (!routeForm) {
      return;
    }
    const startInput = routeForm.elements["route-start"];
    const endInput = routeForm.elements["route-end"];
    const startValue = startInput ? startInput.value : "";
    const endValue = endInput ? endInput.value : "";
    if (!endValue.trim() && !destinationPosition) {
      setFullStatus("请输入目的地。");
      return;
    }

    setFullStatus("正在生成 Apple 地图导航链接...");
    try {
      const start = await resolvePoint(startValue, currentPosition);
      const end = endValue.trim() ? await resolvePoint(endValue, destinationPosition || currentPosition) : destinationPosition;
      setDestination(end, end.label);
      routeUrlValue = appleRouteUrl(start, end);
      updateAppleMapLinks();
      setFullStatus("已生成导航链接，可点击“打开导航”。");
    } catch (error) {
      setFullStatus("路线规划暂时不可用。");
    }
  }

  function initMapModule() {
    updateAppleMapLinks();
    requestLocation();

    if (expandButton) {
      expandButton.addEventListener("click", openModal);
    }
    if (closeButton) {
      closeButton.addEventListener("click", closeModal);
    }
    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) {
          closeModal();
        }
      });
    }
    if (searchForm) {
      searchForm.addEventListener("submit", handleSearch);
    }
    if (routeForm) {
      routeForm.addEventListener("submit", handleRoute);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMapModule);
  } else {
    initMapModule();
  }
})();
