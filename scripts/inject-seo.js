const fs = require('fs');
const path = require('path');

const SEO_FILE = path.join(__dirname, '../content/site/seo.json');
const INDEX_FILE = path.join(__dirname, '../index.html');

function injectSEO() {
  console.log('Injecting SEO metadata...');
  
  try {
    const seoData = JSON.parse(fs.readFileSync(SEO_FILE, 'utf8')).seo;
    let html = fs.readFileSync(INDEX_FILE, 'utf8');

    // Helper to replace content by ID or attribute
    const replaceById = (id, newValue, isAttribute = false, attrName = 'content') => {
      // Intentional no-op as we use specific replacements below
    };

    // Using simpler targeted replacements for the specific SEO IDs used in index.html
    const replacements = [
      { id: 'seo-title', value: seoData.title, type: 'text' },
      { id: 'seo-description', value: seoData.description, type: 'attr', attr: 'content' },
      { id: 'seo-canonical', value: seoData.canonicalUrl, type: 'attr', attr: 'href' },
      { id: 'seo-og-title', value: seoData.title, type: 'attr', attr: 'content' },
      { id: 'seo-og-description', value: seoData.description, type: 'attr', attr: 'content' },
      { id: 'seo-og-url', value: seoData.canonicalUrl, type: 'attr', attr: 'content' },
      { id: 'seo-og-site-name', value: seoData.siteName, type: 'attr', attr: 'content' },
      { id: 'seo-og-image', value: seoData.image, type: 'attr', attr: 'content' },
      { id: 'seo-og-image-alt', value: seoData.imageAlt, type: 'attr', attr: 'content' },
      { id: 'seo-twitter-title', value: seoData.title, type: 'attr', attr: 'content' },
      { id: 'seo-twitter-description', value: seoData.description, type: 'attr', attr: 'content' },
      { id: 'seo-twitter-image', value: seoData.image, type: 'attr', attr: 'content' },
    ];

    replacements.forEach(rep => {
      if (rep.type === 'text') {
        const regex = new RegExp(`(<[^>]*id="${rep.id}"[^>]*>)([\\s\\S]*?)(</[^>]*>)`, 'g');
        html = html.replace(regex, `$1${rep.value}$3`);
      } else {
        const regex = new RegExp(`(<[^>]*id="${rep.id}"[^>]* ${rep.attr}=")([^"]*)(")`, 'g');
        html = html.replace(regex, `$1${rep.value}$3`);
      }
    });

    // Handle the structured data separately as it's a JSON block
    // We can't easily use the same regex because it's a large block.
    // We'll find the <script id="seo-structured-data"> block and replace its content.
    const sdRegex = /(<script id="seo-structured-data">)([\s\S]*?)(<\/script>)/;
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          "@id": `${seoData.canonicalUrl}#aiman-sam`,
          "name": seoData.personName,
          "alternateName": seoData.alternateName,
          "url": seoData.canonicalUrl,
          "image": seoData.image,
          "jobTitle": seoData.jobTitle,
          "description": seoData.description,
          "email": seoData.email,
          "sameAs": seoData.sameAs,
        },
        {
          "@type": "WebSite",
          "@id": `${seoData.canonicalUrl}#website`,
          "url": seoData.canonicalUrl,
          "name": seoData.siteName,
          "description": seoData.description,
          "publisher": {
            "@id": `${seoData.canonicalUrl}#aiman-sam`,
          }
        }
      ]
    }, null, 2);
    
    html = html.replace(sdRegex, `$1\n${structuredData}\n$3`);

    fs.writeFileSync(INDEX_FILE, html);
    console.log('Successfully injected SEO metadata into index.html');
  } catch (error) {
    console.error('Error injecting SEO:', error);
    process.exit(1);
  }
}

injectSEO();