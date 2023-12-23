## Bezpečný výběr nádobí a materiálů

Při vaření vody je důležité začít správně již při výběru nádobí a materiálů. Zde jsou několik tipů, jak zajistit bezpečný a účinný proces:

- **Kvalitní hrnec:** Zvolte hrnec vyrobený z vhodného materiálu, například nerezové oceli nebo smaltovaného železa. Ujistěte se, že má pevné uchytky a dobře přiléhající víko.
- **Dostatečně velký hrnec:** Zvolte hrnec, který má dostatečný objem pro množství vody, které chcete uvařit. Zabráňte přeplňování hrnce, což může způsobit přetékání.
- **Čistota:** Před vařením vždy důkladně umyjte hrnec a vařečku, aby se minimalizovala kontaminace vody nečistotami.
- **Kontrola nádobí:** Před použitím zkontrolujte hrnec a vařečku na případné trhliny, škrábance nebo odškrabky, které by mohly ovlivnit čistotu vařené vody.

::fig{src=assets/boil.jpg}

Zde je jednoduchý Python kód, který můžete použít k výpočtu objemu vody podle průměru a výšky hrnce:

```py
import math

def objem_vody(prumer, vyska):
    polomer = prumer / 2
    objem = math.pi * polomer**2 * vyska
    return objem

# Příklad použití funkce
prumer_hrnce_cm = 20
vyska_hrnce_cm = 15
objem = objem_vody(prumer_hrnce_cm, vyska_hrnce_cm)
print(f"Objem vody v hrnci je {objem} cm^3.")
```
