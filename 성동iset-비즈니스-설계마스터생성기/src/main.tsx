/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { cleanupOldImages } from "./shared/services/storage/imageVault";

// 앱 시작 시 7일 경과 이미지 자동 정리
cleanupOldImages()
  .then((n) => {
    if (n > 0) console.log(`🧹 정리됨: ${n}개의 오래된 이미지`);
  })
  .catch(console.warn);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
