<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="title"/></title>
        <style>
          :root { color-scheme: light dark; }
          body {
            margin: 0;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            background: Canvas;
            color: CanvasText;
          }
          main {
            width: min(760px, calc(100% - 32px));
            margin: 0 auto;
            padding: 48px 0;
          }
          header {
            border-bottom: 2px solid currentColor;
            margin-bottom: 28px;
            padding-bottom: 20px;
          }
          h1 {
            margin: 0 0 10px;
            font-size: 34px;
            line-height: 1.05;
          }
          p {
            line-height: 1.65;
          }
          .feed-link {
            display: inline-block;
            margin-top: 8px;
            font-weight: 700;
            color: inherit;
          }
          article {
            border: 2px solid currentColor;
            border-radius: 8px;
            margin: 18px 0;
            padding: 20px;
          }
          h2 {
            margin: 0 0 8px;
            font-size: 22px;
            line-height: 1.2;
          }
          a {
            color: inherit;
          }
          time {
            display: block;
            margin: 10px 0 0;
            opacity: 0.72;
            font-size: 14px;
          }
          .note {
            margin-top: 28px;
            opacity: 0.72;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <h1><xsl:value-of select="title"/></h1>
            <p><xsl:value-of select="description"/></p>
            <a class="feed-link">
              <xsl:attribute name="href"><xsl:value-of select="atom:link/@href"/></xsl:attribute>
              RSS feed URL
            </a>
          </header>

          <xsl:for-each select="item">
            <article>
              <h2>
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <p><xsl:value-of select="description"/></p>
              <time><xsl:value-of select="pubDate"/></time>
            </article>
          </xsl:for-each>

          <p class="note">This page is an RSS feed. Use the feed URL in an RSS reader to subscribe.</p>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
