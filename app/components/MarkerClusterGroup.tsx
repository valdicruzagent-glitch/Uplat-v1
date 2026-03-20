"use client";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import type React from "react";
import L from "leaflet";
import { createLayerComponent } from "@react-leaflet/core";

// Leaflet.markercluster integration for react-leaflet v5.
// Active listings will be clustered; comps are rendered separately as normal Markers.

type MarkerClusterGroupProps = L.LayerOptions &
  // markercluster plugin options (not in @types/leaflet)
  Record<string, unknown> & {
    // react-leaflet will inject children
    children?: React.ReactNode;
  };

const MarkerClusterGroup = createLayerComponent<any, MarkerClusterGroupProps>(
  function createMarkerClusterGroup(props, ctx) {
    // markerClusterGroup comes from leaflet.markercluster plugin.
    const instance = (L as any).markerClusterGroup(props);
    return { instance, context: { ...ctx, layerContainer: instance } };
  },
  function updateMarkerClusterGroup(layer, props, prevProps) {
    // markercluster options are not designed for granular updates; recreate if needed.
    // For now, just update common options that are safe to mutate.
    if (props.maxClusterRadius !== prevProps.maxClusterRadius) {
      layer.options.maxClusterRadius = props.maxClusterRadius;
    }
  }
);

export default MarkerClusterGroup;
