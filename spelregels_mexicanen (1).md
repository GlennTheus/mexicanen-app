# Spelregels Drankspel "Mexicanen" — Logica voor App-Ontwikkeling

Dit document bevat de exacte functionele logica en als-dan-regels voor het drankspel "Mexicanen". Dit is direct gestructureerd voor programmeurs om te vertalen naar code (ifs/else-statements en state management).

---

## 0. Spelstart (Game Initialization)

* **ALS** het spel wordt gestart, **DAN** wordt de eerste startspeler willekeurig gekozen uit alle deelnemende spelers (random selectie).
* **ALS** een ronde is afgelopen, **DAN** wordt de startspeler van de volgende ronde de speler die links zit van de vorige startspeler (of een andere vaste volgorde die bij de start is bepaald).

---

## 1. De Beurt en Worpen (Turn Management)

* **ALS** een speler aan de beurt is, **DAN** gebruikt de speler altijd exact twee dobbelstenen.
* **ALS** de speler de startspeler van een nieuwe ronde is, **DAN** mag deze speler minimaal 1 keer en maximaal 3 keer gooien.
* **ALS** de startspeler besluit de beurt te beëindigen na *N* worpen (waarbij $1 \le N \le 3$), **DAN** is *N* het absolute maximum aantal toegestane worpen voor elke opvolgende speler in diezelfde ronde.

---

## 2. Dobbelstenen Laten Liggen (Dice Retention)

* **ALS** een speler in de laatste worp een 1 of een 2 gooit, **DAN** mag de direct opvolgende speler deze dobbelsteen laten liggen en in de eerste eigen worp alleen met de andere dobbelsteen gooien.
* **ALS** een speler een dobbelsteen laat liggen die door de vorige speler is gegooid, **DAN** mag de speler daarna deze specifieke dobbelsteen *niet* meer doorgeven/laten liggen voor de speler die volgt. Het moet een actieve, nieuwe worp zijn.
* **ALS** een speler met de overgebleven dobbelsteen een nieuwe 1 of 2 gooit, **DAN** mag de daaropvolgende speler deze nieuwe dobbelsteen wel weer laten liggen.

---

## 3. Scoreberekening en Waarden (Score Evaluation)

* **ALS** een worp uit twee verschillende cijfers bestaat EN geen '21' of '31' is, **DAN** vormt het hoogste cijfer het tiental en het laagste cijfer de eenheid (bijv. een worp van 5 en 4 wordt geregistreerd als score `54`).
* **ALS** een worp `3` en `2` is, **DAN** wordt dit geregistreerd als score `32` (dit is de laagst mogelijke reguliere score).
* **ALS** een worp uit twee gelijke cijfers bestaat, **DAN** wordt de score berekend als dit getal vermenigvuldigd met 100 (bijv. 6 en 6 wordt score `600`, 1 en 1 wordt score `100`).
* **ALS** de worp een `1` en een `2` (of `2` en `1`) is, **DAN** is de score een **'Mexicaantje' (21)**. Dit geldt als de absoluut hoogst mogelijke score in het spel.

---

## 4. Speciale Worp: 31 (Action Trigger)

* **ALS** een speler `3` en `1` (score 31) gooit, **DAN** deelt deze speler direct 1 slok uit aan een speler naar keuze.
* **ALS** een speler 31 gooit, **DAN** telt deze worp *niet* mee voor het maximaal aantal toegestane worpen ($N$) van de huidige ronde en moet de speler direct opnieuw gooien.
* **ALS** de speler bij de herkansings-worp wéér 31 gooit, **DAN** herhaalt het uitdelen van de slok en het opnieuw gooien zich zonder limiet (oneindige loop mogelijk tot een andere score wordt gegooid).

---

## 5. De Status: Het Honderdmannetje (Global State)

* **ALS** een speler `1` en `1` (score 100) gooit, **DAN** krijgt deze speler de globale status `Honderdmannetje`.
* **ALS** een speler de status `Honderdmannetje` heeft EN een andere speler gooit in een latere beurt `1` en `1` (100), **DAN** verliest de eerste speler deze status en wordt de actieve gegooid-hebbende speler het nieuwe `Honderdmannetje`.
* **ALS** er een `Honderdmannetje` actief is in de game-state EN een willekeurige speler (inclusief het Honderdmannetje zelf) gooit een honderdtal (`100`, `200`, `300`, `400`, `500` of `600`), **DAN** moet het Honderdmannetje direct een aantal slokken drinken gelijk aan het eerste cijfer van die worp (bijv. 6 slokken bij een worp van 600).

---

## 6. Ronde-einde en Verliezer bepalen (Round Resolution)

* **ALS** de beurt weer terug is bij de startspeler van de actieve ronde, **DAN** wordt de ronde gemarkeerd als afgelopen.
* **ALS** de ronde is afgelopen, **DAN** is de speler met de laagste eindscore de verliezer van de ronde.
* **ALS** de verliezer is bepaald, **DAN** moet deze speler de basisstraf van **2 slokken** drinken.
* **ALS** er tijdens de lopende ronde door één of meerdere spelers een 'Mexicaantje' (21) is gegooid, **DAN** krijgt de verliezer per gegooid Mexicaantje **5 extra slokken** bovenop de basisstraf.

> **Voorbeeld:** verliezer + 2 Mexicaantjes gegooid in de ronde → 2 + (2 × 5) = **12 slokken totaal**.

---

## 7. Gelijkspel-afhandeling (Tie-Breaker Logic)

* **ALS** aan het einde van de ronde twee of meer spelers exact dezelfde laagste eindscore hebben, **DAN** activeert de status `Gelijkspel`.
* **ALS** er een `Gelijkspel` actief is, **DAN** gooien de betrokken spelers exact 1 keer (een 'sudden death' worp).
* **ALS** een speler tijdens deze tie-breaker de hoogste score gooit, **DAN** is deze speler veilig.
* **ALS** een speler de laagste score gooit tijdens de tie-breaker, **DAN** is deze speler de definitieve verliezer van de ronde (en treden de drinkregels uit sectie 6 in werking).
* **ALS** er tijdens de tie-breaker worpen een Mexicaantje wordt gegooid, **DAN** tellen deze ook mee als extra slokken (5 per Mexicaantje) voor de uiteindelijke verliezer.
* **ALS** de tie-breaker zelf ook op gelijkspel eindigt (meerdere spelers gooien dezelfde laagste score), **DAN** wordt er direct een nieuwe tie-breaker-ronde gespeeld. Dit herhaalt zich totdat er een duidelijke verliezer is.

---

## Overzicht Drinkstraffen (Quick Reference)

| Situatie | Slokken |
|---|---|
| Verliezer van een ronde (basis) | 2 slokken |
| Per Mexicaantje (21) gegooid in die ronde | +5 slokken per stuk |
| Worp van 31 → uitdelen aan speler naar keuze | 1 slok |
| Honderdmannetje bij een honderdtalworp | cijfer × 1 slok (bijv. 600 = 6 slokken) |
