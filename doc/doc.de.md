>Das Masterportal benötigt verschiedene Konfigurationsdateien, die auf diesen Seiten dokumentiert sind. Außerdem werden die verfügbaren URL-Parameter sowie die für das Master-Portal notwendigen Proxies beschrieben.

[TOC]

# Konfigurationsdateien #
Das Masterportal baut auf globalen und portalspezifischen Konfigurationsdateien auf.

Globale Konfigurationsdateien. (Es ergibt Sinn, dass diese von allen Portalen gemeinsam genutzt werden):

* **[services.json](services.json.de.md)**:  alle verfügbaren WMS-Layer und WFS-FeatureTypes
* **[rest-services.json](rest-services.json.de.md)**: URLs zu verschiedenen Diensten
* **[style.json](style.json.de.md)**: Style-Definitionen für WFS-FeatureTypes

Portalspezifische Konfigurationsdateien:

* **[config.js](config.js.de.md)**: Konfiguration von Pfaden zu weiteren Konfigurationsdateien und zu nutzenden Diensten.
* **[config.json](config.json.de.md)**: Konfiguration der Portal-Oberfläche und der Inhalte.

Die folgende Abbildung zeigt schematisch das Zusammenspiel der Dateien. Wichtig ist, dass sich die Dateien index.html, **[config.js](config.js.de.md)** und **[config.json](config.json.de.md)** im selben Verzeichnis befinden.

!**[Konfig-Überblick.png](Konfig-Überblick.de.png)**

# URL-Parameter #
Das Masterportal kann über **[URL-Parameter](urlParameter.de.md)** aufgerufen werden.

# Proxies #
Für das Abfragen von Attributinformationen (WMS GetFeatureInfo) oder für das Laden von WFS-Layern werden vom Masterportal **[Proxies](proxy.de.md)** vorausgesetzt.