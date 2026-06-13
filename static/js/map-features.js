(function () {
  const root = document.querySelector("[data-map]");
  if (!root) {
    return;
  }

  const previewEl = document.querySelector("[data-map-preview]");
  const statusEl = document.querySelector("[data-map-status]");
  const expandButton = document.querySelector("[data-map-expand]");
  const modal = document.querySelector("[data-map-modal]");
  const fullEl = document.querySelector("[data-map-full]");
  const closeButton = document.querySelector("[data-map-close]");
  const searchForm = document.querySelector("[data-map-search]");
  const routeForm = document.querySelector("[data-map-route]");
  const resultsEl = document.querySelector("[data-map-results]");
  const fullStatusEl = document.querySelector("[data-map-full-status]");

  const defaultPosition = {
    lat: Number(root.dataset.defaultLatitude) || 22.5333,
    lng: Number(root.dataset.defaultLongitude) || 113.9304,
    label: root.dataset.defaultLabel || "深圳大学"
  };

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileOptions = {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  };

  let currentPosition = defaultPosition;
  let destinationPosition = null;
  let previewMap = null;
  let fullMap = null;
  let previewMarker = null;
  let fullCurrentMarker = null;
  let fullDestinationMarker = null;
  let routeLayer = null;

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

  function createTileLayer() {
    return window.L.tileLayer(tileUrl, tileOptions);
  }

  function setMarker(map, marker, position, label) {
    if (!map) {
      return marker;
    }
    const nextMarker = marker || window.L.marker([position.lat, position.lng]).addTo(map);
    nextMarker.setLatLng([position.lat, position.lng]);
    nextMarker.bindPopup(label || position.label || "当前位置");
    return nextMarker;
  }

  function updateMaps(position, label) {
    currentPosition = {
      lat: position.lat,
      lng: position.lng,
      label: label || position.label || "当前位置"
    };

    if (previewMap) {
      previewMarker = setMarker(previewMap, previewMarker, currentPosition, currentPosition.label);
      previewMap.setView([currentPosition.lat, currentPosition.lng], 14);
    }

    if (fullMap) {
      fullCurrentMarker = setMarker(fullMap, fullCurrentMarker, currentPosition, currentPosition.label);
      fullMap.setView([currentPosition.lat, currentPosition.lng], 14);
    }
  }

  function initPreviewMap() {
    if (!window.L || !previewEl) {
      setStatus("地图资源加载失败。");
      return;
    }

    previewMap = window.L.map(previewEl, {
      center: [defaultPosition.lat, defaultPosition.lng],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      dragging: false
    });
    createTileLayer().addTo(previewMap);
    previewMarker = setMarker(previewMap, previewMarker, defaultPosition, defaultPosition.label);
  }

  function requestLocation() {
    // 当前位置需要浏览器授权；拒绝或超时则回退到默认办公区域，避免地图空白。
    if (!navigator.geolocation) {
      setStatus("浏览器不支持定位，已显示默认区域。");
      updateMaps(defaultPosition, defaultPosition.label);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "当前位置"
        };
        updateMaps(coords, coords.label);
        setStatus("已定位当前位置。");
      },
      function () {
        updateMaps(defaultPosition, defaultPosition.label);
        setStatus("无法读取浏览器定位，已显示默认区域。");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  function ensureFullMap() {
    if (!window.L || !fullEl) {
      setFullStatus("地图资源加载失败。");
      return;
    }

    if (!fullMap) {
      fullMap = window.L.map(fullEl, {
        center: [currentPosition.lat, currentPosition.lng],
        zoom: 14
      });
      createTileLayer().addTo(fullMap);
    }

    fullCurrentMarker = setMarker(fullMap, fullCurrentMarker, currentPosition, currentPosition.label);

    if (destinationPosition) {
      setDestination(destinationPosition, destinationPosition.label);
    }

    setTimeout(function () {
      fullMap.invalidateSize();
      fullMap.setView([currentPosition.lat, currentPosition.lng], 14);
    }, 80);
  }

  function openModal() {
    if (!modal) {
      return;
    }
    modal.hidden = false;
    document.body.classList.add("map-modal-open");
    ensureFullMap();
    setFullStatus("等待地点检索或路线规划。");
  }

  function closeModal() {
    if (!modal) {
      return;
    }
    modal.hidden = true;
    document.body.classList.remove("map-modal-open");
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
        setFullStatus("已选择目的地。");
        const routeEnd = routeForm ? routeForm.elements["route-end"] : null;
        if (routeEnd) {
          routeEnd.value = result.label;
        }
      });
      resultsEl.appendChild(button);
    });
  }

  function setDestination(position, label) {
    destinationPosition = {
      lat: position.lat,
      lng: position.lng,
      label: label || position.label || "目的地"
    };

    if (!fullMap) {
      return;
    }

    fullDestinationMarker = setMarker(fullMap, fullDestinationMarker, destinationPosition, destinationPosition.label);
    const bounds = window.L.latLngBounds(
      [currentPosition.lat, currentPosition.lng],
      [destinationPosition.lat, destinationPosition.lng]
    );
    fullMap.fitBounds(bounds, { padding: [42, 42], maxZoom: 15 });
  }

  function routeUrl(start, end) {
    const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const params = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      steps: "false"
    });
    return `https://router.project-osrm.org/route/v1/driving/${coords}?${params.toString()}`;
  }

  function formatDistance(meters) {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      return rest ? `${hours} h ${rest} min` : `${hours} h`;
    }
    return `${minutes} min`;
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

  async function drawRoute(start, end) {
    const response = await fetch(routeUrl(start, end), {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("route failed");
    }
    const payload = await response.json();
    if (payload.code !== "Ok" || !payload.routes || payload.routes.length === 0) {
      throw new Error("no route");
    }

    const route = payload.routes[0];
    if (routeLayer) {
      routeLayer.remove();
    }
    routeLayer = window.L.geoJSON(route.geometry, {
      style: {
        color: "#24527a",
        opacity: 0.86,
        weight: 5
      }
    }).addTo(fullMap);
    fullMap.fitBounds(routeLayer.getBounds(), { padding: [42, 42] });
    setFullStatus(`路线：${formatDistance(route.distance)}，约 ${formatDuration(route.duration)}。`);
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
    if (!routeForm || !fullMap) {
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

    setFullStatus("正在规划路线...");
    try {
      const start = await resolvePoint(startValue, currentPosition);
      const end = endValue.trim() ? await resolvePoint(endValue, destinationPosition || currentPosition) : destinationPosition;
      setDestination(end, end.label);
      await drawRoute(start, end);
    } catch (error) {
      setFullStatus("路线规划暂时不可用。");
    }
  }

  function initMapModule() {
    if (!previewEl) {
      return;
    }
    initPreviewMap();
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
