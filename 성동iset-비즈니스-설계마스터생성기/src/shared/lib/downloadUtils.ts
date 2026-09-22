/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// jsPDF and html2canvas are loaded from CDN in index.html
declare const jspdf: any;
declare const html2canvas: any;

/**
 * Triggers a browser download for a CSV string.
 * @param csvContent The string content of the CSV.
 * @param filename The desired name for the downloaded file.
 */
export const downloadCsv = (csvContent: string, filename: string): void => {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" }); // Add BOM for Excel compatibility
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generates a PNG data URL from an HTML element. Used for creating history previews.
 * @param element The HTML element to capture.
 * @returns A promise that resolves with the data URL of the generated image.
 */
export const generatePreviewImage = async (element: HTMLElement): Promise<string> => {
  if (!element) {
    throw new Error("미리보기 생성 실패: 유효한 HTML 요소가 제공되지 않았습니다.");
  }
  try {
    const canvas = await html2canvas(element, {
      scale: 1, // Lower scale for previews is fine
      useCORS: true,
      backgroundColor: "#171717", // A neutral dark background
      windowWidth: 800, // Constrain width for smaller image size
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("미리보기 이미지 생성 중 오류 발생:", error);
    throw error;
  }
};

/**
 * Generates a PDF from an HTML element and triggers a download.
 * @param element The HTML element to capture.
 * @param filename The desired name for the downloaded PDF file.
 */
export const downloadPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  if (!element) {
    console.error("PDF 생성 실패: 유효한 HTML 요소가 제공되지 않았습니다.");
    return;
  }

  try {
    const { jsPDF } = jspdf;
    const canvas = await html2canvas(element, {
      scale: 2, // Increase scale for better quality
      useCORS: true,
      backgroundColor: "#0a0a0a", // Match app background
      // Ensure charts are rendered before capture
      onclone: (doc: Document) => {
        const chartContainers = doc.querySelectorAll(".chart-container");
        chartContainers.forEach((container: Element) => {
          // This is a bit of a hack, but helps ensure charts are visible
          (container as HTMLElement).style.display = "block";
          (container as HTMLElement).style.width = "800px";
        });
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "p",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error("PDF 생성 중 오류 발생:", error);
  }
};
