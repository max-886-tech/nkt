(function () {
  const params = new URLSearchParams(window.location.search);
  const original = params.get("p") || window.location.pathname; // from 404 redirect or direct open
  const pathname = original.split("?")[0].split("#")[0];

  document.getElementById("urlPath").textContent = pathname;

  // Expect: /<product>-manufacturer-in-<city>/
  // Examples:
  // /backpacks-manufacturer-in-mumbai/
  // /schoolsbags-manufacturer-in-pune/
  const clean = pathname.replace(/^\/|\/$/g, ""); // remove leading/trailing slash
  const m = clean.match(/^([a-z0-9-]+)-manufacturer-in-([a-z0-9-]+)$/i);

  if (!m) {
    document.title = "Not Found";
    document.getElementById("pageTitle").textContent = "Page not found";
    document.getElementById("pagePara").textContent =
      "This URL does not match the expected pattern: /{product}-manufacturer-in-{city}/";
    return;
  }

  const productSlug = m[1];
  const citySlug = m[2];

  // Make it readable
  const productName = productSlug.replace(/-/g, " ");
  const cityName = citySlug.replace(/-/g, " ");

  // Your paragraph template (simple replace)
  const para =
    `Sana Bags is dedicated to producing high-quality ${productName} in ${cityName} ` +
    `that cater to a wide range of needs, from school and college use to travel and outdoor activities. ` +
    `Our nylon ${productName} are designed with durability, functionality, and style in mind, ` +
    `making them the ideal choice for students, professionals, and adventurers alike.`;

  const title = `${productName} manufacturer in ${cityName} | Sana Bags`;

  document.title = title;
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pagePara").textContent = para;
})();
