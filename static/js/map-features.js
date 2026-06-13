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

  const tileUrl = "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}";
  const tileOptions = {
    maxZoom: 19,
    subdomains: ["1", "2", "3", "4"],
    attribution: "高德地图"
  };
  const gcjA = 6378245.0;
  const gcjEe = 0.006693421622965943;

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

  function outOfChina(lat, lng) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  }

  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  }

  function toMapPosition(position) {
    const lat = position.lat;
    const lng = position.lng;
    if (outOfChina(lat, lng)) {
      return position;
    }

    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);
    const radLat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - gcjEe * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((gcjA * (1 - gcjEe)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (gcjA / sqrtMagic * Math.cos(radLat) * Math.PI);
    return {
      lat: lat + dLat,
      lng: lng + dLng,
      label: position.label
    };
  }

  function toMapLatLng(position) {
    const mapped = toMapPosition(position);
    return [mapped.lat, mapped.lng];
  }

  function mapRouteGeometry(geometry) {
    return {
      type: geometry.type,
      coordinates: geometry.coordinates.map(function (coord) {
        const mapped = toMapPosition({ lng: coord[0], lat: coord[1] });
        return [mapped.lng, mapped.lat];
      })
    };
  }

  function setMarker(map, marker, position, label) {
    if (!map) {
      return marker;
    }
    const latLng = toMapLatLng(position);
    const nextMarker = marker || window.L.marker(latLng).addTo(map);
    nextMarker.setLatLng(latLng);
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
      previewMap.setView(toMapLatLng(currentPosition), 14);
    }

    if (fullMap) {
      fullCurrentMarker = setMarker(fullMap, fullCurrentMarker, currentPosition, currentPosition.label);
      fullMap.setView(toMapLatLng(currentPosition), 14);
    }
  }

  function initPreviewMap() {
    if (!window.L || !previewEl) {
      setStatus("地图资源加载失败。");
      return;
    }

    previewMap = window.L.map(previewEl, {
      center: toMapLatLng(defaultPosition),
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
        center: toMapLatLng(currentPosition),
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
      fullMap.setView(toMapLatLng(currentPosition), 14);
    }, 80);
  }

  function requestMapFullscreen() {
    if (!modal || !modal.requestFullscreen) {
      return;
    }
    modal.requestFullscreen().catch(function () {
      setFullStatus("浏览器未允许系统全屏，已使用页面全屏地图。");
    });
  }

  function openModal() {
    if (!modal) {
      return;
    }
    modal.hidden = false;
    document.body.classList.add("map-modal-open");
    ensureFullMap();
    setFullStatus("等待地点检索或路线规划。");
    requestMapFullscreen();
    setTimeout(function () {
      if (fullMap) {
        fullMap.invalidateSize();
      }
    }, 240);
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
      toMapLatLng(currentPosition),
      toMapLatLng(destinationPosition)
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
    routeLayer = window.L.geoJSON(mapRouteGeometry(route.geometry), {
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
