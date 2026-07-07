const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://grenfell.memorial/#website",
      url: "https://grenfell.memorial",
      name: "Grenfell Tower Digital Memorial",
      description: "Educational 3D reconstruction and memorial for Grenfell Tower.",
      inLanguage: "en-GB",
      isAccessibleForFree: true,
      publisher: { "@id": "https://grenfell.memorial/#org" },
    },
    {
      "@type": "Organization",
      "@id": "https://grenfell.memorial/#org",
      name: "Grenfell Tower Digital Memorial",
      url: "https://grenfell.memorial",
      logo: "https://grenfell.memorial/icon-512.png",
    },
    {
      "@type": "LandmarksOrHistoricalBuildings",
      "@id": "https://grenfell.memorial/#tower",
      name: "Grenfell Tower",
      description:
        "24-storey residential tower completed in 1974 on the Lancaster West " +
        "Estate, North Kensington. Reclad in 2016. 72 people lost their lives " +
        "in the fire of 14 June 2017.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Grenfell Road, Lancaster West Estate",
        addressLocality: "North Kensington, London",
        postalCode: "W11",
        addressCountry: "GB",
      },
      geo: { "@type": "GeoCoordinates", latitude: 51.514, longitude: -0.2157 },
      image: "https://grenfell.memorial/og-image.png",
      sameAs: [
        "https://en.wikipedia.org/wiki/Grenfell_Tower",
        "https://www.grenfelltowerinquiry.org.uk",
      ],
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
