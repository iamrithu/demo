let value = false;

function remove() {
  let elem = document.getElementsByClassName("esri-basemap-gallery__item");
  for (var i = 0; i < elem.length; i++) {
    elem[i].title = "";
  }
}

function reload() {
  document.getElementById("cog2").style.transform = "rotate(270deg)";
  document.getElementById("cog2").style.transition = "0.5s";
  location.reload();
}

function back() {
  document.getElementById("cog").style.transform = "rotate(0deg)";
  document.getElementById("cog").style.color = "  #919189";
  document.getElementById("tab1").style.top = "-10%";
  document.getElementById("tab2").style.top = "-10%";
  document.getElementById("tab3").style.top = "-10%";
  document.getElementById("tab4").style.top = "-10%";
  value = false;
}

require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/LayerList",
  "esri/widgets/BasemapGallery",
  "esri/widgets/ScaleBar",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/widgets/support/SnappingControls",
  "esri/widgets/Search",
  "esri/widgets/Locate",
  "esri/widgets/Track",
  "esri/widgets/Expand",
  "esri/geometry/support/webMercatorUtils",
  "esri/widgets/CoordinateConversion",
  "esri/geometry/geometryEngine",
], (
  esriConfig,
  Map,
  MapView,
  Graphic,
  GraphicsLayer,
  FeatureLayer,
  LayerList,
  BasemapGallery,
  ScaleBar,
  SketchViewModel,
  SnappingControls,
  Search,
  Locate,
  Track,
  Expand,
  webMercatorUtils,
  CoordinateConversion,
  geometryEngine
) => {
  esriConfig.apiKey =
    "AAPK98c50a3510cc4cb9a07dc3116113843cqZssDSqHkgmBfOp_v5GIAETd4ggp7oleJJQPSyr9NmmTf-2GSs7swp9zS6T42ny7";
  const graphicsLayer = new GraphicsLayer({ title: "graphicsLayer" });

  const map = new Map({
    basemap: "arcgis-imagery",
    layers: [graphicsLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 4,
    center: [-100.521191, 55.069323],
  });

  const scalebar = new ScaleBar({
    view: view,
    unit: "metric",
  });

  view.ui.add(scalebar, "bottom-right");

  const measurements = document.getElementById("measurements");
  view.ui.add(measurements, "manual");

  const basemapGallery = new BasemapGallery({
    view: view,
    container: document.getElementById("map"),
  });
  const search = new Search({
    //Add Search widget
    view: view,
  });
  const track = new Track({
    view: view,
    graphic: new Graphic({
      symbol: {
        type: "simple-marker",
        size: "12px",
        color: "red",
        outline: {
          color: "#efefef",
          width: "1.5px",
        },
      },
    }),
    useHeadingEnabled: false,
  });

  view.ui.add(search, "top-left");
  view.ui.add(track, "top-left");

  const sketchVM = new SketchViewModel({
    view: view,
    layer: graphicsLayer,
    creationMode: "update",
    updateOnGraphicClick: true,
  });

  sketchVM.on("update", (e) => {
    const geometry = e.graphics[0].geometry;

    if (e.state === "start") {
      switchType(geometry);
    }

    if (e.state === "complete") {
      // graphicsLayer.remove(graphicsLayer.graphics.getItemAt(0));
      // measurements.innerHTML = null;
    }

    if (
      e.toolEventInfo &&
      (e.toolEventInfo.type === "scale-stop" ||
        e.toolEventInfo.type === "reshape-stop" ||
        e.toolEventInfo.type === "move-stop")
    ) {
      switchType(geometry);
    }
  });

  function getArea(polygon) {
    const geodesicArea = geometryEngine.geodesicArea(
      polygon,
      "square-kilometers"
    );
    const planarArea = geometryEngine.planarArea(polygon, "square-kilometers");

    measurements.innerHTML =
      "<b>Geodesic area</b>:  " +
      geodesicArea.toFixed(2) +
      " km\xB2" +
      " |   <b>Planar area</b>: " +
      planarArea.toFixed(2) +
      "  km\xB2";
  }

  function getLength(line) {
    const geodesicLength = geometryEngine.geodesicLength(line, "kilometers");
    const planarLength = geometryEngine.planarLength(line, "kilometers");

    measurements.innerHTML =
      "<b>Geodesic length</b>:  " +
      geodesicLength.toFixed(2) +
      " km" +
      " |   <b>Planar length</b>: " +
      planarLength.toFixed(2) +
      "  km";
  }

  function switchType(geom) {
    console.log(webMercatorUtils.webMercatorToGeographic(geom).toJSON());
    switch (geom.type) {
      case "polygon":
        getArea(geom);

        break;
      case "polyline":
        getLength(geom);
        break;
      default:
        console.log("No value found");
    }
  }

  // Add the calcite-panel for the styler to an Expand to hide/show the panel
  const stylerExpand = new Expand({
    view: view,
    content: document.getElementById("propPanel"),
    expanded: false,
    expandIconClass: "esri-icon-edit",
    expandTooltip: "Open Styler",
  });

  // Add SnappingControls to handle snapping
  const snappingControls = new SnappingControls({
    view: view,

    // Sets the widget to use the SketchViewModel's SnappingOptions
    snappingOptions: sketchVM.snappingOptions,
  });

  // Add the SnappingControls to an Expand widget to hide/show the widget
  const snappingExpand = new Expand({
    view: view,
    // container: document.getElementById("snap"),
    content: snappingControls,
    expanded: false,
    expandIconClass: "esri-icon-settings2",
    expandTooltip: "Snapping Controls",
  });

  // Add the shortcut key description panel to an Expand widget
  // const shortcutKeysExpand = new Expand({
  //   view: view,
  //   content: document.getElementById("sketchVM-controls"),
  //   expanded: false,
  //   color: "red",
  //   expandIconClass: "esri-icon-description",
  //   expandTooltip: "Keyboard Shortcuts",
  // });

  view.when(() => {
    // Configure the UI to use the default property values from our SketchViewModel
    setDefaultCreateOptions();
    setDefaultUpdateOptions();
    setDefaultPointSymbol();
    setDefaultPolylineSymbol();
    setDefaultPolygonSymbol();
  });

  view.ui.add(stylerExpand, "bottom-right");
  view.ui.add(snappingExpand, "top-left");
  // Add the calcite panel
  // Add the Expand with SnappingControls widget
  // view.ui.add(shortcutKeysExpand, "top-left");

  // Connecting the calcite actions with their corresponding SketchViewModel tools
  const pointBtn = document.getElementById("pointBtn");
  const polylineBtn = document.getElementById("polylineBtn");
  const polygonBtn = document.getElementById("polygonBtn");
  const circleBtn = document.getElementById("circleBtn");
  const rectangleBtn = document.getElementById("rectangleBtn");
  const clearBtn = document.getElementById("clearBtn");
  const selectBtn = document.getElementById("selectBtn");

  sketchVM.on("create", function (event) {
    let coordinte;
    if (event.state === "complete") {
      var obj = prompt("Name of the shape");

      coordinte = [
        webMercatorUtils
          .webMercatorToGeographic(event.graphic.geometry)
          .toJSON(),
      ];

      coordinte.map((info) => {
        if (obj != "") {
          alert();
          if (info.paths != null) {
            fetch(" https://arc-map.herokuapp.com/geolocation", {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              method: "POST",
              body: JSON.stringify({
                shapeName: obj,
                shapeType: "polyline",
                geometry: info.paths,
              }),
            })
              .then(function (res) {
                console.log(res);
              })
              .catch(function (res) {
                console.log(res);
              });
          } else if (info.x != null) {
            fetch(" https://arc-map.herokuapp.com/geolocation", {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              method: "POST",
              body: JSON.stringify({
                shapeName: obj,
                shapeType: "point",
                geometry: [info.x, info.y],
              }),
            })
              .then(function (res) {
                console.log(res);
              })
              .catch(function (res) {
                console.log(res);
              });
          } else {
            fetch(" https://arc-map.herokuapp.com/geolocation", {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              method: "POST",
              body: JSON.stringify({
                shapeName: obj,
                shapeType: "polygon",
                geometry: [info.rings],
              }),
            })
              .then(function (res) {
                console.log(res);
              })
              .catch(function (res) {
                console.log(res);
              });
          }
        } else {
          alert("Give any name for  shape");
        }
      });
    } else {
    }
  });

  function sample() {
    alert("hi");
  }

  pointBtn.onclick = (e) => {
    sketchVM.create("point");
  };
  polylineBtn.onclick = () => {
    sketchVM.create("polyline");
  };
  polygonBtn.onclick = () => {
    sketchVM.create("polygon");
  };
  circleBtn.onclick = () => {
    sketchVM.create("circle");
  };
  rectangleBtn.onclick = () => {
    sketchVM.create("rectangle");
  };
  clearBtn.onclick = () => {
    sketchVM.layer.removeAll();
  };
  selectBtn.onclick = () => {
    sketchVM.cancel();
  };

  // Calcite UI logic
  // Auto-populate UI with default SketchViewModel properties set.
  // If no default values are set, UI will be set accordingly.
  function setDefaultCreateOptions() {
    const options = sketchVM.defaultCreateOptions;
    const modeSelect = document.getElementById("mode-select");

    // set default mode in the select element if defined
    if (options?.mode) {
      setDefaultOption(modeSelect, options.mode);
    }

    // handles mode select changes
    modeSelect.addEventListener("calciteSelectChange", () => {
      sketchVM.defaultCreateOptions["mode"] = modeSelect.selectedOption.value;
    });
  }

  function setDefaultUpdateOptions() {
    const options = sketchVM.defaultUpdateOptions;
    const rotationSwitch = document.getElementById("rotationSwitch");
    const scaleSwitch = document.getElementById("scaleSwitch");
    const multipleSelectionSwitch = document.getElementById(
      "multipleSelectionSwitch"
    );
    const aspectRatioSwitch = document.getElementById("aspectRatioSwitch");

    // set the UI elements to the default property values
    // rotationSwitch.switched = options.enableRotation;
    // scaleSwitch.switched = options.enableScaling;
    // multipleSelectionSwitch.switched = options.multipleSelectionEnabled;
    // aspectRatioSwitch.switched = options.preserveAspectRatio;

    // event listeners for UI interactions
    // rotationSwitch.addEventListener("calciteSwitchChange", (evt) => {
    //   sketchVM.defaultUpdateOptions.enableRotation = evt.target.switched;
    // });
    // scaleSwitch.addEventListener("calciteSwitchChange", (evt) => {
    //   sketchVM.defaultUpdateOptions.enableScaling = evt.target.switched;
    // });
    // multipleSelectionSwitch.addEventListener("calciteSwitchChange", (evt) => {
    //   sketchVM.defaultUpdateOptions.multipleSelectionEnabled =
    //     evt.target.switched;
    // });
    // aspectRatioSwitch.addEventListener("calciteSwitchChange", (evt) => {
    //   sketchVM.defaultUpdateOptions.preserveAspectRatio = evt.target.switched;
    // });
  }

  function setDefaultPointSymbol() {
    const pointSymbol = sketchVM.pointSymbol;
    const pointStyleSelect = document.getElementById("point-style-select");
    const pointSymbolOutlineBtn = document.getElementById("point-outline-btn");
    const pointSizeInput = document.getElementById("point-size-input");
    const pointXOffsetInput = document.getElementById("point-xoffset-input");
    const pointYOffsetInput = document.getElementById("point-yoffset-input");
    const pointAngleInput = document.getElementById("point-angle-input");
    const pointColorInput = document.getElementById("point-color-input");
    const slsWidthInput = document.getElementById("point-sls-width-input");
    const slsColorInput = document.getElementById("point-sls-color-input");

    pointSizeInput.value = pointSymbol.size;
    pointXOffsetInput.value = pointSymbol.xoffset;
    pointYOffsetInput.value = pointSymbol.yoffset;
    pointAngleInput.value = pointSymbol.angle;
    slsWidthInput.value = pointSymbol.outline.width;

    // set default style in the select element
    setDefaultOption(pointStyleSelect, pointSymbol.style);

    pointSizeInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.size = parseInt(evt.target.value);
    });
    pointXOffsetInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.xoffset = parseInt(evt.target.value);
    });
    pointYOffsetInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.yoffset = parseInt(evt.target.value);
    });
    pointAngleInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.angle = parseInt(evt.target.value);
    });
    pointStyleSelect.addEventListener("calciteSelectChange", () => {
      pointSymbol.style = pointStyleSelect.selectedOption.value;
    });
    pointColorInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.color = evt.target.value;
    });
    pointSymbolOutlineBtn.onclick = () => {
      openModal("point-outline-modal");
    };
    // point outline modal event listeners
    slsWidthInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.outline.width = parseInt(evt.target.value);
    });
    slsColorInput.addEventListener("calciteInputInput", (evt) => {
      pointSymbol.outline.color = evt.target.value;
    });
  }

  function setDefaultPolylineSymbol() {
    const lineSymbol = sketchVM.polylineSymbol;
    const lineStyleSelect = document.getElementById("line-style-select");
    const lineWidthInput = document.getElementById("line-width-input");
    const lineColorInput = document.getElementById("line-color-input");

    lineWidthInput.value = lineSymbol.width;

    // set default style in the select element
    setDefaultOption(lineStyleSelect, lineSymbol.style);

    lineStyleSelect.addEventListener("calciteSelectChange", () => {
      lineSymbol.style = lineStyleSelect.selectedOption.value;
    });
    lineWidthInput.addEventListener("calciteInputInput", (evt) => {
      lineSymbol.width = parseInt(evt.target.value);
    });
    lineColorInput.addEventListener("calciteInputInput", (evt) => {
      lineSymbol.color = evt.target.value;
    });
  }

  function setDefaultPolygonSymbol() {
    const polygonSymbol = sketchVM.polygonSymbol;
    const polygonStyleSelect = document.getElementById("polygon-style-select");
    const polygonSymbolOutlineBtn = document.getElementById(
      "polygon-outline-btn"
    );
    const polygonColorInput = document.getElementById("polygon-color-input");
    const slsStyleSelect = document.getElementById("polygon-sls-style-select");
    const slsWidthInput = document.getElementById("polygon-sls-width-input");
    const slsColorInput = document.getElementById("polygon-sls-color-input");

    slsWidthInput.value = polygonSymbol.outline.width;

    // set default style in the select element
    setDefaultOption(polygonStyleSelect, polygonSymbol.style);
    setDefaultOption(slsStyleSelect, polygonSymbol.outline.style);

    polygonStyleSelect.addEventListener("calciteSelectChange", () => {
      polygonSymbol.style = polygonStyleSelect.selectedOption.value;
    });
    polygonColorInput.addEventListener("calciteInputInput", (evt) => {
      polygonSymbol.color = evt.target.value;
    });
    polygonSymbolOutlineBtn.onclick = () => {
      openModal("polygon-outline-modal");
    };
    // polygon outline modal event listeners
    slsStyleSelect.addEventListener("calciteSelectChange", () => {
      polygonSymbol.outline.style = slsStyleSelect.selectedOption.value;
    });
    slsWidthInput.addEventListener("calciteInputInput", (evt) => {
      polygonSymbol.outline.width = parseInt(evt.target.value);
    });
    slsColorInput.addEventListener("calciteInputInput", (evt) => {
      polygonSymbol.outline.color = evt.target.value;
    });
  }

  // function to auto-populate calcite select components
  function setDefaultOption(selectElement, value) {
    for (let i = 0; i < selectElement.children.length; i++) {
      let option = selectElement.children[i];
      if (option.value === value) {
        option.selected = true;
      }
    }
  }

  // displays the appropriate modals
  function openModal(id) {
    document.getElementById(id).active = true;
  }

  var coordsWidget = document.createElement("div");
  coordsWidget.id = "coordsWidget";
  coordsWidget.className = "esri-widget esri-component";
  coordsWidget.style.padding = "9px 15px 5px";

  view.ui.add(coordsWidget, "bottom-right");

  view.watch("stationary", function (isStationary) {
    showCoordinates(view.center);
  });
  function showCoordinates(pt) {
    //*** UPDATE ***//
    var coords =
      "  Scale 1:" + Math.round(view.scale * 1) / 1 + " | Zoom " + view.zoom;
    coordsWidget.innerHTML = coords;
  }
  view.on("pointer-move", function (evt) {
    showCoordinates(view.toMap({ x: evt.x, y: evt.y }));
  });
  var coordinateConversionWidget = new CoordinateConversion({
    view: view,
  });

  view.ui.add(coordinateConversionWidget, "bottom-left");
});
var openValue = false;
function Import() {
  sample();
  if (openValue == false) {
    document.getElementById("selectmap").style.display = "block";
    document.getElementById("selectmap").style.transition = "1";

    openValue = true;
  } else {
    document.getElementById("selectmap").style.display = "none";

    openValue = false;
  }
}

function sample() {
  axios.get(" https://arc-map.herokuapp.com/geolocation").then((res) => {
    document.getElementById("selectmap").innerHTML =
      "<select id='select2'  ondblclick='del(this.value)' onfocus='this.size=10' onblur='this.size=1;' onchange='choose(this.value)'> <option>  choose your shapes</option>" +
      res.data
        .map((e) => {
          return (
            "<option name=" + e.shapeName + ">" + e.shapeName + "<option> "
          );
        })
        .join("------------------------") +
      "</select>";
  });
}
function choose(x) {
  require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapGallery",
    "esri/widgets/ScaleBar",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/widgets/support/SnappingControls",
    "esri/widgets/Search",
    "esri/widgets/Locate",
    "esri/widgets/Track",
    "esri/widgets/Expand",
    "esri/geometry/support/webMercatorUtils",
    "esri/widgets/CoordinateConversion",
    "esri/geometry/geometryEngine",
  ], (
    esriConfig,
    Map,
    MapView,
    Graphic,
    GraphicsLayer,
    FeatureLayer,
    LayerList,
    BasemapGallery,
    ScaleBar,
    SketchViewModel,
    SnappingControls,
    Search,
    Locate,
    Track,
    Expand,
    webMercatorUtils,
    CoordinateConversion,
    geometryEngine
  ) => {
    esriConfig.apiKey =
      "AAPK98c50a3510cc4cb9a07dc3116113843cqZssDSqHkgmBfOp_v5GIAETd4ggp7oleJJQPSyr9NmmTf-2GSs7swp9zS6T42ny7";
    const graphicsLayer = new GraphicsLayer({ title: "graphicsLayer" });

    const map = new Map({
      basemap: "arcgis-imagery",
      layers: [graphicsLayer],
    });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 4,
      center: [-100.521191, 55.069323],
    });

    const scalebar = new ScaleBar({
      view: view,
      unit: "metric",
    });

    view.ui.add(scalebar, "bottom-right");

    const measurements = document.getElementById("measurements");
    view.ui.add(measurements, "manual");

    const basemapGallery = new BasemapGallery({
      view: view,
      container: document.getElementById("map"),
      source: {
        query: {
          title: '"World Basemaps for Developers" AND owner:esri',
        },
      },
    });
    const search = new Search({
      //Add Search widget
      view: view,
    });
    const track = new Track({
      view: view,
      graphic: new Graphic({
        symbol: {
          type: "simple-marker",
          size: "12px",
          color: "red",
          outline: {
            color: "#efefef",
            width: "1.5px",
          },
        },
      }),
      useHeadingEnabled: false,
    });

    view.ui.add(search, "top-left");
    view.ui.add(track, "top-left");

    const sketchVM = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
      creationMode: "update",
      updateOnGraphicClick: true,
    });

    sketchVM.on("update", (e) => {
      const geometry = e.graphics[0].geometry;

      if (e.state === "start") {
        switchType(geometry);
      }

      if (e.state === "complete") {
        // graphicsLayer.remove(graphicsLayer.graphics.getItemAt(0));
        // measurements.innerHTML = null;
      }

      if (
        e.toolEventInfo &&
        (e.toolEventInfo.type === "scale-stop" ||
          e.toolEventInfo.type === "reshape-stop" ||
          e.toolEventInfo.type === "move-stop")
      ) {
        switchType(geometry);
      }
    });

    function getArea(polygon) {
      const geodesicArea = geometryEngine.geodesicArea(
        polygon,
        "square-kilometers"
      );
      const planarArea = geometryEngine.planarArea(
        polygon,
        "square-kilometers"
      );

      measurements.innerHTML =
        "<b>Geodesic area</b>:  " +
        geodesicArea.toFixed(2) +
        " km\xB2" +
        " |   <b>Planar area</b>: " +
        planarArea.toFixed(2) +
        "  km\xB2";
    }

    function getLength(line) {
      const geodesicLength = geometryEngine.geodesicLength(line, "kilometers");
      const planarLength = geometryEngine.planarLength(line, "kilometers");

      measurements.innerHTML =
        "<b>Geodesic length</b>:  " +
        geodesicLength.toFixed(2) +
        " km" +
        " |   <b>Planar length</b>: " +
        planarLength.toFixed(2) +
        "  km";
    }

    function switchType(geom) {
      console.log(webMercatorUtils.webMercatorToGeographic(geom).toJSON());
      switch (geom.type) {
        case "polygon":
          getArea(geom);

          break;
        case "polyline":
          getLength(geom);
          break;
        default:
          console.log("No value found");
      }
    }

    // Add the calcite-panel for the styler to an Expand to hide/show the panel
    const stylerExpand = new Expand({
      view: view,
      content: document.getElementById("propPanel"),
      expanded: false,
      expandIconClass: "esri-icon-edit",
      expandTooltip: "Open Styler",
    });

    // Add SnappingControls to handle snapping
    const snappingControls = new SnappingControls({
      view: view,

      // Sets the widget to use the SketchViewModel's SnappingOptions
      snappingOptions: sketchVM.snappingOptions,
    });

    // Add the SnappingControls to an Expand widget to hide/show the widget
    const snappingExpand = new Expand({
      view: view,
      // container: document.getElementById("snap"),
      content: snappingControls,
      expanded: false,
      expandIconClass: "esri-icon-settings2",
      expandTooltip: "Snapping Controls",
    });

    // Add the shortcut key description panel to an Expand widget
    // const shortcutKeysExpand = new Expand({
    //   view: view,
    //   content: document.getElementById("sketchVM-controls"),
    //   expanded: false,
    //   color: "red",
    //   expandIconClass: "esri-icon-description",
    //   expandTooltip: "Keyboard Shortcuts",
    // });

    view.when(() => {
      // Configure the UI to use the default property values from our SketchViewModel
      setDefaultCreateOptions();
      setDefaultUpdateOptions();
      setDefaultPointSymbol();
      setDefaultPolylineSymbol();
      setDefaultPolygonSymbol();
    });

    view.ui.add(stylerExpand, "bottom-right");
    view.ui.add(snappingExpand, "top-left");
    // Add the calcite panel
    // Add the Expand with SnappingControls widget
    // view.ui.add(shortcutKeysExpand, "top-left");

    // Connecting the calcite actions with their corresponding SketchViewModel tools
    const pointBtn = document.getElementById("pointBtn");
    const polylineBtn = document.getElementById("polylineBtn");
    const polygonBtn = document.getElementById("polygonBtn");
    const circleBtn = document.getElementById("circleBtn");
    const rectangleBtn = document.getElementById("rectangleBtn");
    const clearBtn = document.getElementById("clearBtn");
    const selectBtn = document.getElementById("selectBtn");

    sketchVM.on("create", function (event) {
      let coordinte;
      if (event.state === "complete") {
        var obj = prompt("Name of the shape");

        coordinte = [
          webMercatorUtils
            .webMercatorToGeographic(event.graphic.geometry)
            .toJSON(),
        ];

        coordinte.map((info) => {
          if (obj != "") {
            alert();
            if (info.paths != null) {
              fetch(" https://arc-map.herokuapp.com/geolocation", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  shapeName: obj,
                  shapeType: "polyline",
                  geometry: info.paths,
                }),
              })
                .then(function (res) {
                  console.log(res);
                })
                .catch(function (res) {
                  console.log(res);
                });
            } else if (info.x != null) {
              fetch(" https://arc-map.herokuapp.com/geolocation", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  shapeName: obj,
                  shapeType: "point",
                  geometry: [info.x, info.y],
                }),
              })
                .then(function (res) {
                  console.log(res);
                })
                .catch(function (res) {
                  console.log(res);
                });
            } else {
              fetch(" https://arc-map.herokuapp.com/geolocation", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  shapeName: obj,
                  shapeType: "polygon",
                  geometry: [info.rings],
                }),
              })
                .then(function (res) {
                  console.log(res);
                })
                .catch(function (res) {
                  console.log(res);
                });
            }
          } else {
            alert("Give any name for  shape");
          }
        });
      } else {
      }
    });

    pointBtn.onclick = (e) => {
      sketchVM.create("point");
    };
    polylineBtn.onclick = () => {
      sketchVM.create("polyline");
    };
    polygonBtn.onclick = () => {
      sketchVM.create("polygon");
    };
    circleBtn.onclick = () => {
      sketchVM.create("circle");
    };
    rectangleBtn.onclick = () => {
      sketchVM.create("rectangle");
    };
    clearBtn.onclick = () => {
      sketchVM.layer.removeAll();
    };
    selectBtn.onclick = () => {
      sketchVM.cancel();
    };

    // Calcite UI logic
    // Auto-populate UI with default SketchViewModel properties set.
    // If no default values are set, UI will be set accordingly.
    function setDefaultCreateOptions() {
      const options = sketchVM.defaultCreateOptions;
      const modeSelect = document.getElementById("mode-select");

      // set default mode in the select element if defined
      if (options?.mode) {
        setDefaultOption(modeSelect, options.mode);
      }

      // handles mode select changes
      modeSelect.addEventListener("calciteSelectChange", () => {
        sketchVM.defaultCreateOptions["mode"] = modeSelect.selectedOption.value;
      });
    }

    function setDefaultUpdateOptions() {
      const options = sketchVM.defaultUpdateOptions;
      const rotationSwitch = document.getElementById("rotationSwitch");
      const scaleSwitch = document.getElementById("scaleSwitch");
      const multipleSelectionSwitch = document.getElementById(
        "multipleSelectionSwitch"
      );
      const aspectRatioSwitch = document.getElementById("aspectRatioSwitch");

      // set the UI elements to the default property values
      rotationSwitch.switched = options.enableRotation;
      scaleSwitch.switched = options.enableScaling;
      multipleSelectionSwitch.switched = options.multipleSelectionEnabled;
      aspectRatioSwitch.switched = options.preserveAspectRatio;

      // event listeners for UI interactions
      rotationSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.enableRotation = evt.target.switched;
      });
      scaleSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.enableScaling = evt.target.switched;
      });
      multipleSelectionSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.multipleSelectionEnabled =
          evt.target.switched;
      });
      aspectRatioSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.preserveAspectRatio = evt.target.switched;
      });
    }

    function setDefaultPointSymbol() {
      const pointSymbol = sketchVM.pointSymbol;
      const pointStyleSelect = document.getElementById("point-style-select");
      const pointSymbolOutlineBtn =
        document.getElementById("point-outline-btn");
      const pointSizeInput = document.getElementById("point-size-input");
      const pointXOffsetInput = document.getElementById("point-xoffset-input");
      const pointYOffsetInput = document.getElementById("point-yoffset-input");
      const pointAngleInput = document.getElementById("point-angle-input");
      const pointColorInput = document.getElementById("point-color-input");
      const slsWidthInput = document.getElementById("point-sls-width-input");
      const slsColorInput = document.getElementById("point-sls-color-input");

      pointSizeInput.value = pointSymbol.size;
      pointXOffsetInput.value = pointSymbol.xoffset;
      pointYOffsetInput.value = pointSymbol.yoffset;
      pointAngleInput.value = pointSymbol.angle;
      slsWidthInput.value = pointSymbol.outline.width;

      // set default style in the select element
      setDefaultOption(pointStyleSelect, pointSymbol.style);

      pointSizeInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.size = parseInt(evt.target.value);
      });
      pointXOffsetInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.xoffset = parseInt(evt.target.value);
      });
      pointYOffsetInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.yoffset = parseInt(evt.target.value);
      });
      pointAngleInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.angle = parseInt(evt.target.value);
      });
      pointStyleSelect.addEventListener("calciteSelectChange", () => {
        pointSymbol.style = pointStyleSelect.selectedOption.value;
      });
      pointColorInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.color = evt.target.value;
      });
      pointSymbolOutlineBtn.onclick = () => {
        openModal("point-outline-modal");
      };
      // point outline modal event listeners
      slsWidthInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.outline.width = parseInt(evt.target.value);
      });
      slsColorInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.outline.color = evt.target.value;
      });
    }

    function setDefaultPolylineSymbol() {
      const lineSymbol = sketchVM.polylineSymbol;
      const lineStyleSelect = document.getElementById("line-style-select");
      const lineWidthInput = document.getElementById("line-width-input");
      const lineColorInput = document.getElementById("line-color-input");

      lineWidthInput.value = lineSymbol.width;

      // set default style in the select element
      setDefaultOption(lineStyleSelect, lineSymbol.style);

      lineStyleSelect.addEventListener("calciteSelectChange", () => {
        lineSymbol.style = lineStyleSelect.selectedOption.value;
      });
      lineWidthInput.addEventListener("calciteInputInput", (evt) => {
        lineSymbol.width = parseInt(evt.target.value);
      });
      lineColorInput.addEventListener("calciteInputInput", (evt) => {
        lineSymbol.color = evt.target.value;
      });
    }

    function setDefaultPolygonSymbol() {
      const polygonSymbol = sketchVM.polygonSymbol;
      const polygonStyleSelect = document.getElementById(
        "polygon-style-select"
      );
      const polygonSymbolOutlineBtn = document.getElementById(
        "polygon-outline-btn"
      );
      const polygonColorInput = document.getElementById("polygon-color-input");
      const slsStyleSelect = document.getElementById(
        "polygon-sls-style-select"
      );
      const slsWidthInput = document.getElementById("polygon-sls-width-input");
      const slsColorInput = document.getElementById("polygon-sls-color-input");

      slsWidthInput.value = polygonSymbol.outline.width;

      // set default style in the select element
      setDefaultOption(polygonStyleSelect, polygonSymbol.style);
      setDefaultOption(slsStyleSelect, polygonSymbol.outline.style);

      polygonStyleSelect.addEventListener("calciteSelectChange", () => {
        polygonSymbol.style = polygonStyleSelect.selectedOption.value;
      });
      polygonColorInput.addEventListener("calciteInputInput", (evt) => {
        polygonSymbol.color = evt.target.value;
      });
      polygonSymbolOutlineBtn.onclick = () => {
        openModal("polygon-outline-modal");
      };
      // polygon outline modal event listeners
      slsStyleSelect.addEventListener("calciteSelectChange", () => {
        polygonSymbol.outline.style = slsStyleSelect.selectedOption.value;
      });
      slsWidthInput.addEventListener("calciteInputInput", (evt) => {
        polygonSymbol.outline.width = parseInt(evt.target.value);
      });
      slsColorInput.addEventListener("calciteInputInput", (evt) => {
        polygonSymbol.outline.color = evt.target.value;
      });
    }
    //

    if (
      document.getElementById("select2").value === "choose your shapes" ||
      document.getElementById("select2").value === "------------------------"
    ) {
      return null; // alert("hi");
    } else {
      axios
        .get("https://arc-map.herokuapp.com/geolocation/" + x)
        .then((res) => {
          if (res.data.shapeType === "point") {
            const map = new Map({
              basemap: "arcgis-navigation", //Basemap layer service
            });

            const view = new MapView({
              map: map,
              center: [-100.607, 54.992], //Longitude, latitude
              zoom: 3,
              container: "viewDiv",
            });

            const graphicsLayer = new GraphicsLayer();
            map.add(graphicsLayer);
            const point = {
              //Create a point
              type: "point",
              longitude: res.data.geometry[0],
              latitude: res.data.geometry[1],
            };
            const simpleMarkerSymbol = {
              type: "simple-marker",
              color: [226, 119, 40], // Orange
              outline: {
                color: [255, 255, 255], // White
                width: 3,
              },
            };

            const pointGraphic = new Graphic({
              geometry: point,
              symbol: simpleMarkerSymbol,
            });
            graphicsLayer.add(pointGraphic);
          } else if (res.data.shapeType === "polyline") {
            const polyline = {
              type: "polyline",
              paths: res.data.geometry, //Longitude, latitude
            };
            const simpleLineSymbol = {
              type: "simple-line",
              color: [226, 119, 40], // Orange
              width: 2,
            };
            const popupTemplate = {
              title: res.data.shapeName,
              content: "{Description}",
            };
            const attributes = {
              Name: res.data.shapeName,
              Description:
                res.data.shapeType +
                "" +
                res.data.geometry.map((e) => {
                  return e.map((info) => {
                    return "[" + info + "]";
                  });
                }),
            };

            const polylineGraphic = new Graphic({
              geometry: polyline,
              symbol: simpleLineSymbol,
              attributes: attributes,
              popupTemplate: popupTemplate,
            });
            graphicsLayer.add(polylineGraphic);
          } else if (res.data.shapeType === "polygon") {
            const polygon = {
              type: "polygon",
              spatialReference: {
                wkid: 4326,
              },
              rings: res.data.geometry.map((e) => {
                return e[0];
              }),
            };
            // const polygon = {
            //   type: "polygon",
            //   spatialReference: {
            //     wkid: 3857,
            //   },
            //   rings: [
            //     [
            //       [-7012757.625037769, -2485673.507779031],
            //       [-7012757.625037769, -607157.1006430425],
            //       [-5134241.217901781, -607157.1006430425],
            //       [-5134241.217901781, -2485673.507779031],
            //       [-7012757.625037769, -2485673.507779031],
            //     ],
            //     [
            //       [6058585.707950247, 3384690.2645210493],
            //       [6058585.707950247, 5263206.671657024],
            //       [7937102.115086244, 5263206.671657024],
            //       [7937102.115086244, 3384690.2645210493],
            //       [6058585.707950247, 3384690.2645210493],
            //     ],
            //   ],
            // };

            const simpleFillSymbol = {
              type: "simple-fill",
              color: [227, 139, 79, 0.3], // Orange, opacity 80%
              outline: {
                color: [0, 0, 0],
                width: 1,
              },
            };

            const popupTemplate = {
              title: res.data.shapeName,
              content: "{Description}",
            };
            const attributes = {
              Name: "",
              Description:
                res.data.shapeType +
                "" +
                res.data.geometry.map((e) => {
                  return e.map((info) => {
                    return info.map((E) => {
                      return "[" + E + "]";
                    });
                  });
                }),
            };

            const polygonGraphic = new Graphic({
              geometry: polygon,
              symbol: simpleFillSymbol,

              attributes: attributes,
              popupTemplate: popupTemplate,
            });
            graphicsLayer.add(polygonGraphic);

            view.when(() => {
              sketchVM.update(polygonGraphic);
              getArea(polygonGraphic.geometry);
            });
          }
        });
    }

    // function to auto-populate calcite select components
    function setDefaultOption(selectElement, value) {
      for (let i = 0; i < selectElement.children.length; i++) {
        let option = selectElement.children[i];
        if (option.value === value) {
          option.selected = true;
        }
      }
    }

    // displays the appropriate modals
    function openModal(id) {
      document.getElementById(id).active = true;
    }

    var coordsWidget = document.createElement("div");
    coordsWidget.id = "coordsWidget";
    coordsWidget.className = "esri-widget esri-component";
    coordsWidget.style.padding = "9px 15px 5px";

    view.ui.add(coordsWidget, "bottom-right");

    view.watch("stationary", function (isStationary) {
      showCoordinates(view.center);
    });
    function showCoordinates(pt) {
      //*** UPDATE ***//
      var coords =
        "  Scale 1:" + Math.round(view.scale * 1) / 1 + " | Zoom " + view.zoom;
      coordsWidget.innerHTML = coords;
    }
    view.on("pointer-move", function (evt) {
      showCoordinates(view.toMap({ x: evt.x, y: evt.y }));
    });
    var coordinateConversionWidget = new CoordinateConversion({
      view: view,
    });

    view.ui.add(coordinateConversionWidget, "bottom-left");
  });
}
var BaseMap = false;

function basemap() {
  if (BaseMap === false) {
    document.getElementById("map").style.right = "1%";
    BaseMap = true;
  } else {
    document.getElementById("map").style.right = "-100%";
    BaseMap = false;
  }
}

function Layer() {
  require([
    "esri/config",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/widgets/support/SnappingControls",
    "esri/Map",
    "esri/layers/GraphicsLayer",
    "esri/views/MapView",
    "esri/widgets/Expand",

    "esri/widgets/Locate",
    "esri/geometry/support/webMercatorUtils",
    "esri/widgets/Track",
    "esri/Graphic",
    "esri/widgets/Search",
    "esri/widgets/CoordinateConversion",

    "esri/widgets/BasemapGallery",

    "esri/layers/FeatureLayer",

    "esri/widgets/LayerList",
  ], (
    esriConfig,
    SketchViewModel,
    SnappingControls,
    Map,
    GraphicsLayer,
    MapView,
    Expand,
    Locate,
    webMercatorUtils,

    Track,
    Graphic,
    Search,
    CoordinateConversion,

    BasemapGallery,

    FeatureLayer,

    LayerList
  ) => {
    esriConfig.apiKey =
      "AAPK98c50a3510cc4cb9a07dc3116113843cqZssDSqHkgmBfOp_v5GIAETd4ggp7oleJJQPSyr9NmmTf-2GSs7swp9zS6T42ny7";
    const graphicsLayer = new GraphicsLayer({ title: "graphicsLayer" });

    const map = new Map({
      basemap: "arcgis-imagery",
      layers: [graphicsLayer],
    });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 4,
      center: [-100.521191, 55.069323],
    });

    //

    const layerList = new LayerList({
      view: view,

      container: document.getElementById("layer"),
    });

    const Parks_Protected_Areas = new FeatureLayer({
      url: "https://services3.arcgis.com/KD7TtlnkhprHYJ7K/arcgis/rest/services/parks_protected_areas/FeatureServer/0",
    });

    map.add(Parks_Protected_Areas, 0);

    const EOS = new FeatureLayer({
      url: "https://services3.arcgis.com/KD7TtlnkhprHYJ7K/arcgis/rest/services/eos_sensitivearea/FeatureServer/0",
    });

    map.add(EOS, 0);

    const Crown_Reservations = new FeatureLayer({
      url: "https://services3.arcgis.com/KD7TtlnkhprHYJ7K/arcgis/rest/services/crown_reservations/FeatureServer/0",
    });

    map.add(Crown_Reservations, 0);
    const SoilLandsCape = new FeatureLayer({
      url: " https://services3.arcgis.com/KD7TtlnkhprHYJ7K/arcgis/rest/services/soillandscape/FeatureServer/0",
    });

    map.add(SoilLandsCape, 0);

    //

    const basemapGallery = new BasemapGallery({
      view: view,
      container: document.getElementById("map"),
      source: {
        query: {
          title: '"World Basemaps for Developers" AND owner:esri',
        },
      },
    });
    const search = new Search({
      //Add Search widget
      view: view,
    });
    const track = new Track({
      view: view,
      graphic: new Graphic({
        symbol: {
          type: "simple-marker",
          size: "12px",
          color: "red",
          outline: {
            color: "#efefef",
            width: "1.5px",
          },
        },
      }),
      useHeadingEnabled: false,
    });

    view.ui.add(search, "top-left");
    view.ui.add(track, "top-left");

    const sketchVM = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
    });

    // Add the calcite-panel for the styler to an Expand to hide/show the panel
    const stylerExpand = new Expand({
      view: view,
      content: document.getElementById("propPanel"),
      expanded: false,
      expandIconClass: "esri-icon-edit",
      expandTooltip: "Open Styler",
    });

    // Add SnappingControls to handle snapping
    const snappingControls = new SnappingControls({
      view: view,

      // Sets the widget to use the SketchViewModel's SnappingOptions
      snappingOptions: sketchVM.snappingOptions,
    });

    // Add the SnappingControls to an Expand widget to hide/show the widget
    const snappingExpand = new Expand({
      view: view,
      // container: document.getElementById("snap"),
      content: snappingControls,
      expanded: false,
      expandIconClass: "esri-icon-settings2",
      expandTooltip: "Snapping Controls",
    });

    // Add the shortcut key description panel to an Expand widget
    // const shortcutKeysExpand = new Expand({
    //   view: view,
    //   content: document.getElementById("sketchVM-controls"),
    //   expanded: false,
    //   color: "red",
    //   expandIconClass: "esri-icon-description",
    //   expandTooltip: "Keyboard Shortcuts",
    // });

    view.when(() => {
      const sketch = new SketchViewModel({
        layer: graphicsLayer,
        view: view,
      });

      // Configure the UI to use the default property values from our SketchViewModel
      setDefaultCreateOptions();
      setDefaultUpdateOptions();
      setDefaultPointSymbol();
      setDefaultPolylineSymbol();
      setDefaultPolygonSymbol();
    });

    view.ui.add(stylerExpand, "bottom-right");
    view.ui.add(snappingExpand, "top-left");
    // Add the calcite panel
    // Add the Expand with SnappingControls widget
    // view.ui.add(shortcutKeysExpand, "top-left");

    // Connecting the calcite actions with their corresponding SketchViewModel tools
    const pointBtn = document.getElementById("pointBtn");
    const polylineBtn = document.getElementById("polylineBtn");
    const polygonBtn = document.getElementById("polygonBtn");
    const circleBtn = document.getElementById("circleBtn");
    const rectangleBtn = document.getElementById("rectangleBtn");
    const clearBtn = document.getElementById("clearBtn");
    const selectBtn = document.getElementById("selectBtn");

    sketchVM.on("create", function (event) {
      let coordinte;
      if (event.state === "complete") {
        var obj = prompt("Name of the shape");
        coordinte = [
          webMercatorUtils
            .webMercatorToGeographic(event.graphic.geometry)
            .toJSON(),
        ];
        console.log(coordinte);

        coordinte.map((info) => {
          if (obj != "") {
            if (info.paths != null) {
              fetch(" https://arc-map.herokuapp.com/geolocation", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  shapeName: obj,
                  shapeType: "polyline",
                  geometry: info.paths,
                }),
              })
                .then(function (res) {
                  console.log(res);
                })
                .catch(function (res) {
                  console.log(res);
                });
            } else if (info.x != null) {
              fetch(" https://arc-map.herokuapp.com/geolocation", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  shapeName: obj,
                  shapeType: "point",
                  geometry: [info.x, info.y],
                }),
              })
                .then(function (res) {
                  console.log(res);
                })
                .catch(function (res) {
                  console.log(res);
                });
            } else {
              fetch(" https://arc-map.herokuapp.com/geolocation", {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  shapeName: obj,
                  shapeType: "polygon",
                  geometry: [info.rings],
                }),
              })
                .then(function (res) {
                  console.log(res);
                })
                .catch(function (res) {
                  console.log(res);
                });
            }
          } else {
            alert("Give any name for  shape");
          }
        });
      } else {
      }
    });

    pointBtn.onclick = (e) => {
      sketchVM.create("point");
    };
    polylineBtn.onclick = () => {
      sketchVM.create("polyline");
    };
    polygonBtn.onclick = () => {
      sketchVM.create("polygon");
    };
    circleBtn.onclick = () => {
      sketchVM.create("circle");
    };
    rectangleBtn.onclick = () => {
      sketchVM.create("rectangle");
    };
    clearBtn.onclick = () => {
      sketchVM.layer.removeAll();
    };
    selectBtn.onclick = () => {
      sketchVM.cancel();
    };

    // Calcite UI logic
    // Auto-populate UI with default SketchViewModel properties set.
    // If no default values are set, UI will be set accordingly.
    function setDefaultCreateOptions() {
      const options = sketchVM.defaultCreateOptions;
      const modeSelect = document.getElementById("mode-select");

      // set default mode in the select element if defined
      if (options?.mode) {
        setDefaultOption(modeSelect, options.mode);
      }

      // handles mode select changes
      modeSelect.addEventListener("calciteSelectChange", () => {
        sketchVM.defaultCreateOptions["mode"] = modeSelect.selectedOption.value;
      });
    }

    function setDefaultUpdateOptions() {
      const options = sketchVM.defaultUpdateOptions;
      const rotationSwitch = document.getElementById("rotationSwitch");
      const scaleSwitch = document.getElementById("scaleSwitch");
      const multipleSelectionSwitch = document.getElementById(
        "multipleSelectionSwitch"
      );
      const aspectRatioSwitch = document.getElementById("aspectRatioSwitch");

      // set the UI elements to the default property values
      rotationSwitch.switched = options.enableRotation;
      scaleSwitch.switched = options.enableScaling;
      multipleSelectionSwitch.switched = options.multipleSelectionEnabled;
      aspectRatioSwitch.switched = options.preserveAspectRatio;

      // event listeners for UI interactions
      rotationSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.enableRotation = evt.target.switched;
      });
      scaleSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.enableScaling = evt.target.switched;
      });
      multipleSelectionSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.multipleSelectionEnabled =
          evt.target.switched;
      });
      aspectRatioSwitch.addEventListener("calciteSwitchChange", (evt) => {
        sketchVM.defaultUpdateOptions.preserveAspectRatio = evt.target.switched;
      });
    }

    function setDefaultPointSymbol() {
      const pointSymbol = sketchVM.pointSymbol;
      const pointStyleSelect = document.getElementById("point-style-select");
      const pointSymbolOutlineBtn =
        document.getElementById("point-outline-btn");
      const pointSizeInput = document.getElementById("point-size-input");
      const pointXOffsetInput = document.getElementById("point-xoffset-input");
      const pointYOffsetInput = document.getElementById("point-yoffset-input");
      const pointAngleInput = document.getElementById("point-angle-input");
      const pointColorInput = document.getElementById("point-color-input");
      const slsWidthInput = document.getElementById("point-sls-width-input");
      const slsColorInput = document.getElementById("point-sls-color-input");

      pointSizeInput.value = pointSymbol.size;
      pointXOffsetInput.value = pointSymbol.xoffset;
      pointYOffsetInput.value = pointSymbol.yoffset;
      pointAngleInput.value = pointSymbol.angle;
      slsWidthInput.value = pointSymbol.outline.width;

      // set default style in the select element
      setDefaultOption(pointStyleSelect, pointSymbol.style);

      pointSizeInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.size = parseInt(evt.target.value);
      });
      pointXOffsetInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.xoffset = parseInt(evt.target.value);
      });
      pointYOffsetInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.yoffset = parseInt(evt.target.value);
      });
      pointAngleInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.angle = parseInt(evt.target.value);
      });
      pointStyleSelect.addEventListener("calciteSelectChange", () => {
        pointSymbol.style = pointStyleSelect.selectedOption.value;
      });
      pointColorInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.color = evt.target.value;
      });
      pointSymbolOutlineBtn.onclick = () => {
        openModal("point-outline-modal");
      };
      // point outline modal event listeners
      slsWidthInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.outline.width = parseInt(evt.target.value);
      });
      slsColorInput.addEventListener("calciteInputInput", (evt) => {
        pointSymbol.outline.color = evt.target.value;
      });
    }

    function setDefaultPolylineSymbol() {
      const lineSymbol = sketchVM.polylineSymbol;
      const lineStyleSelect = document.getElementById("line-style-select");
      const lineWidthInput = document.getElementById("line-width-input");
      const lineColorInput = document.getElementById("line-color-input");

      lineWidthInput.value = lineSymbol.width;

      // set default style in the select element
      setDefaultOption(lineStyleSelect, lineSymbol.style);

      lineStyleSelect.addEventListener("calciteSelectChange", () => {
        lineSymbol.style = lineStyleSelect.selectedOption.value;
      });
      lineWidthInput.addEventListener("calciteInputInput", (evt) => {
        lineSymbol.width = parseInt(evt.target.value);
      });
      lineColorInput.addEventListener("calciteInputInput", (evt) => {
        lineSymbol.color = evt.target.value;
      });
    }

    function setDefaultPolygonSymbol() {
      const polygonSymbol = sketchVM.polygonSymbol;
      const polygonStyleSelect = document.getElementById(
        "polygon-style-select"
      );
      const polygonSymbolOutlineBtn = document.getElementById(
        "polygon-outline-btn"
      );
      const polygonColorInput = document.getElementById("polygon-color-input");
      const slsStyleSelect = document.getElementById(
        "polygon-sls-style-select"
      );
      const slsWidthInput = document.getElementById("polygon-sls-width-input");
      const slsColorInput = document.getElementById("polygon-sls-color-input");

      slsWidthInput.value = polygonSymbol.outline.width;

      // set default style in the select element
      setDefaultOption(polygonStyleSelect, polygonSymbol.style);
      setDefaultOption(slsStyleSelect, polygonSymbol.outline.style);

      polygonStyleSelect.addEventListener("calciteSelectChange", () => {
        polygonSymbol.style = polygonStyleSelect.selectedOption.value;
      });
      polygonColorInput.addEventListener("calciteInputInput", (evt) => {
        polygonSymbol.color = evt.target.value;
      });
      polygonSymbolOutlineBtn.onclick = () => {
        openModal("polygon-outline-modal");
      };
      // polygon outline modal event listeners
      slsStyleSelect.addEventListener("calciteSelectChange", () => {
        polygonSymbol.outline.style = slsStyleSelect.selectedOption.value;
      });
      slsWidthInput.addEventListener("calciteInputInput", (evt) => {
        polygonSymbol.outline.width = parseInt(evt.target.value);
      });
      slsColorInput.addEventListener("calciteInputInput", (evt) => {
        polygonSymbol.outline.color = evt.target.value;
      });
    }

    // function to auto-populate calcite select components
    function setDefaultOption(selectElement, value) {
      for (let i = 0; i < selectElement.children.length; i++) {
        let option = selectElement.children[i];
        if (option.value === value) {
          option.selected = true;
        }
      }
    }

    // displays the appropriate modals
    function openModal(id) {
      document.getElementById(id).active = true;
    }

    var coordsWidget = document.createElement("div");
    coordsWidget.id = "coordsWidget";
    coordsWidget.className = "esri-widget esri-component";
    coordsWidget.style.padding = "9px 15px 5px";

    view.ui.add(coordsWidget, "bottom-right");

    view.watch("stationary", function (isStationary) {
      showCoordinates(view.center);
    });
    function showCoordinates(pt) {
      //*** UPDATE ***//
      var coords =
        "  Scale 1:" + Math.round(view.scale * 1) / 1 + " | Zoom " + view.zoom;
      coordsWidget.innerHTML = coords;
    }
    view.on("pointer-move", function (evt) {
      showCoordinates(view.toMap({ x: evt.x, y: evt.y }));
    });
    var coordinateConversionWidget = new CoordinateConversion({
      view: view,
    });

    view.ui.add(coordinateConversionWidget, "bottom-left");
  });
}
