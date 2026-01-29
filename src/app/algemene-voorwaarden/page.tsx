import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden | Bouwbeslag',
  description: 'Lees onze algemene voorwaarden voor gebruik van onze diensten en producten.',
};

export default function TermsAndConditionsPage() {
  const content = `
    <h2>Inhoudsopgave</h2>
    <p>Artikel 1 - Definities<br>Artikel 2 - Identiteit van de ondernemer<br>Artikel 3 - Toepasselijkheid<br>Artikel 4 - Het aanbod<br>Artikel 5 - De overeenkomst<br>Artikel 6 - Herroepingsrecht<br>Artikel 7 - Kosten in geval van herroeping<br>Artikel 8 - Uitsluiting herroepingsrecht<br>Artikel 9 - De prijs<br>Artikel 10 - Conformiteit en garantie<br>Artikel 11 - Levering en uitvoering<br>Artikel 12 - Duurtransacties: duur, opzegging en verlenging<br>Artikel 13 - Betaling<br>Artikel 14 - Klachtenregeling<br>Artikel 15 - Geschillen<br>Artikel 16 - Aanvullende of afwijkende bepalingen</p>

    <h3>Artikel 1 - Definities</h3>
    <p>In deze voorwaarden wordt verstaan onder:</p>
    <ol>
        <li><b>Bedenktijd:</b> de termijn waarbinnen de consument gebruik kan maken van zijn herroepingsrecht;</li>
        <li><b>Consument:</b> de natuurlijke persoon die niet handelt in de uitoefening van beroep of bedrijf en een overeenkomst op afstand aangaat met de ondernemer;</li>
        <li><b>Dag:</b> kalenderdag;</li>
        <li><b>Duurtransactie:</b> een overeenkomst op afstand met betrekking tot een reeks van producten en/of diensten, waarvan de leverings- en/of afnameverplichting in de tijd is gespreid;</li>
        <li><b>Duurzame gegevensdrager:</b> elk middel dat de consument of ondernemer in staat stelt om informatie die aan hem persoonlijk is gericht, op te slaan op een manier die toekomstige raadpleging en ongewijzigde reproductie van de opgeslagen informatie mogelijk maakt.</li>
        <li><b>Herroepingsrecht:</b> de mogelijkheid voor de consument om binnen de bedenktijd af te zien van de overeenkomst op afstand;</li>
        <li><b>Modelformulier:</b> het modelformulier voor herroeping die de ondernemer ter beschikking stelt die een consument kan invullen wanneer hij gebruik wil maken van zijn herroepingsrecht.</li>
        <li><b>Ondernemer:</b> de natuurlijke of rechtspersoon die producten en/of diensten op afstand aan consumenten aanbiedt;</li>
        <li><b>Overeenkomst op afstand:</b> een overeenkomst waarbij in het kader van een door de ondernemer georganiseerd systeem voor verkoop op afstand van producten en/of diensten, tot en met het sluiten van de overeenkomst uitsluitend gebruik gemaakt wordt van één of meer technieken voor communicatie op afstand;</li>
        <li><b>Techniek voor communicatie op afstand:</b> middel dat kan worden gebruikt voor het sluiten van een overeenkomst, zonder dat consument en ondernemer gelijktijdig in dezelfde ruimte zijn samengekomen.</li>
        <li><b>Algemene Voorwaarden:</b> de onderhavige Algemene Voorwaarden van de ondernemer.</li>
    </ol>

    <h3>Artikel 2 - Identiteit van de ondernemer</h3>
    <p>Bouwbeslag.nl;<br>Oenerweg 30<br>8181RJ Heerde</p>
    <p>Telefoonnummer: 0578760508<br>E-mailadres: contact@bouwbeslag.nl<br>KvK-nummer: 77245350<br>BTW-identificatienummer: NL003174000B88</p>

    <h3>Artikel 3 - Toepasselijkheid</h3>
    <ol>
        <li>Deze algemene voorwaarden zijn van toepassing op elk aanbod van de ondernemer en op elke tot stand gekomen overeenkomst op afstand en bestellingen tussen ondernemer en consument.</li>
        <li>Voordat de overeenkomst op afstand wordt gesloten, wordt de tekst van deze algemene voorwaarden aan de consument beschikbaar gesteld. Indien dit redelijkerwijs niet mogelijk is, zal voordat de overeenkomst op afstand wordt gesloten, worden aangegeven dat de algemene voorwaarden bij de ondernemer in te zien en zij op verzoek van de consument zo spoedig mogelijk kosteloos worden toegezonden.</li>
        <li>Indien de overeenkomst op afstand elektronisch wordt gesloten, kan in afwijking van het vorige lid en voordat de overeenkomst op afstand wordt gesloten, de tekst van deze algemene voorwaarden langs elektronische weg aan de consument ter beschikking worden gesteld op zodanige wijze dat deze door de consument op een eenvoudige manier kan worden opgeslagen op een duurzame gegevensdrager. Indien dit redelijkerwijs niet mogelijk is, zal voordat de overeenkomst op afstand wordt gesloten, worden aangegeven waar van de algemene voorwaarden langs elektronische weg kan worden kennisgenomen en dat zij op verzoek van de consument langs elektronische weg of op andere wijze kosteloos zullen worden toegezonden.</li>
        <li>Voor het geval dat naast deze algemene voorwaarden tevens specifieke product- of dienstenvoorwaarden van toepassing zijn, is het tweede en derde lid van overeenkomstige toepassing en kan de consument zich in geval van tegenstrijdige algemene voorwaarden steeds beroepen op de toepasselijke bepaling die voor hem het meest gunstig is.</li>
        <li>Indien één of meerdere bepalingen in deze algemene voorwaarden op enig moment geheel of gedeeltelijk nietig zijn of vernietigd worden, dan blijft de overeenkomst en deze voorwaarden voor het overige in stand en zal de betreffende bepaling in onderling overleg onverwijld vervangen worden door een bepaling dat de strekking van het oorspronkelijke zoveel mogelijk benaderd.</li>
        <li>Situaties die niet in deze algemene voorwaarden zijn geregeld, dienen te worden beoordeeld ‘naar de geest’ van deze algemene voorwaarden.</li>
        <li>Onduidelijkheden over de uitleg of inhoud van één of meerdere bepalingen van onze voorwaarden, dienen uitgelegd te worden ‘naar de geest’ van deze algemene voorwaarden.</li>
    </ol>

    <h3>Artikel 4 - Het aanbod</h3>
    <ol>
        <li>Indien een aanbod een beperkte geldigheidsduur heeft of onder voorwaarden geschiedt, wordt dit nadrukkelijk in het aanbod vermeld.</li>
        <li>Het aanbod is vrijblijvend. De ondernemer is gerechtigd het aanbod te wijzigen en aan te passen.</li>
        <li>Het aanbod bevat een volledige en nauwkeurige omschrijving van de aangeboden producten en/of diensten. De beschrijving is voldoende gedetailleerd om een goede beoordeling van het aanbod door de consument mogelijk te maken. Als de ondernemer gebruik maakt van afbeeldingen zijn deze een waarheidsgetrouwe weergave van de aangeboden producten en/of diensten. Kennelijke vergissingen of kennelijke fouten in het aanbod binden de ondernemer niet.</li>
        <li>Alle afbeeldingen, specificaties gegevens in het aanbod zijn indicatie en kunnen geen aanleiding zijn tot schadevergoeding of ontbinding van de overeenkomst.</li>
        <li>Afbeeldingen bij producten zijn een waarheidsgetrouwe weergave van de aangeboden producten. Ondernemer kan niet garanderen dat de weergegeven kleuren exact overeenkomen met de echte kleuren van de producten.</li>
        <li>Elk aanbod bevat zodanige informatie, dat voor de consument duidelijk is wat de rechten en verplichtingen zijn, die aan de aanvaarding van het aanbod zijn verbonden. Dit betreft in het bijzonder: de prijs inclusief belastingen; de eventuele kosten van verzending; de wijze waarop de overeenkomst tot stand zal komen en welke handelingen daarvoor nodig zijn; het al dan niet van toepassing zijn van het herroepingsrecht; de wijze van betaling, aflevering en uitvoering van de overeenkomst; de termijn voor aanvaarding van het aanbod, dan wel de termijn waarbinnen de ondernemer de prijs garandeert; de hoogte van het tarief voor communicatie op afstand indien de kosten van het gebruik van de techniek voor communicatie op afstand worden berekend op een andere grondslag dan het reguliere basistarief voor het gebruikte communicatiemiddel; of de overeenkomst na de totstandkoming wordt gearchiveerd, en zo ja op welke deze voor de consument te raadplegen is; de manier waarop de consument, voor het sluiten van de overeenkomst, de door hem in het kader van de overeenkomst verstrekte gegevens kan controleren en indien gewenst herstellen; de eventuele andere talen waarin, naast het Nederlands, de overeenkomst kan worden gesloten; de gedragscodes waaraan de ondernemer zich heeft onderworpen en de wijze waarop de consument deze gedragscodes langs elektronische weg kan raadplegen; en de minimale duur van de overeenkomst op afstand in geval van een duurtransactie.</li>
    </ol>

    <h3>Artikel 5 - De overeenkomst</h3>
    <ol>
        <li>De overeenkomst komt, onder voorbehoud van het bepaalde in lid 4, tot stand op het moment van aanvaarding door de consument van het aanbod en het voldoen aan de daarbij gestelde voorwaarden.</li>
        <li>Indien de consument het aanbod langs elektronische weg heeft aanvaard, bevestigt de ondernemer onverwijld langs elektronische weg de ontvangst van de aanvaarding van het aanbod. Zolang de overeenkomst van deze aanvaarding niet door de ondernemer is bevestigd, kan de consument de overeenkomst ontbinden.</li>
        <li>Indien de overeenkomst elektronisch tot stand komt, treft de ondernemer passende technische en organisatorische maatregelen ter beveiliging van de elektronische overdracht van data en zorgt hij voor een veilige webomgeving. Indien de consument elektronisch kan betalen, zal de ondernemer daartoe passende veiligheidsmaatregelen in acht nemen.</li>
        <li>De ondernemer kan zich - binnen wettelijke kaders - op de hoogte stellen of de consument aan zijn betalingsverplichtingen kan voldoen, evenals van al die feiten en factoren die van belang zijn voor een verantwoord aangaan van de overeenkomst op afstand. Indien de ondernemer op grond van dit onderzoek goede gronden heeft om de overeenkomst niet aan te gaan, is hij gerechtigd gemotiveerd een bestelling of aanvraag te weigeren of aan de uitvoering bijzondere voorwaarden te verbinden.</li>
        <li>De ondernemer zal bij het product of dienst aan de consument de volgende informatie, schriftelijk of op zodanige wijze dat deze door de consument op een toegankelijke manier kan worden opgeslagen op een duurzame gegevensdrager, meesturen: het bezoekadres van de vestiging van de ondernemer waar de consument met klachten terecht kan; de voorwaarden waaronder en de wijze waarop de consument van het herroepingsrecht gebruik kan maken, dan wel een duidelijke melding inzake het uitgesloten zijn van het herroepingsrecht; de informatie over garanties en bestaande service na aankoop; de in artikel 4 lid 3 van deze voorwaarden opgenomen gegevens, tenzij de ondernemer deze gegevens al aan de consument heeft verstrekt vóór de uitvoering van de overeenkomst; de vereisten voor opzegging van de overeenkomst indien de overeenkomst een duur heeft van meer dan één jaar of van onbepaalde duur is.</li>
        <li>In geval van een duurtransactie is de bepaling in het vorige lid slechts van toepassing op de eerste levering.</li>
        <li>Iedere overeenkomst wordt aangegaan onder de opschortende voorwaarden van voldoende beschikbaarheid van de betreffende producten.</li>
    </ol>

    <h3>Artikel 6 - Herroepingsrecht</h3>
    <p><i>Bij levering van producten:</i></p>
    <ol>
        <li>Bij de aankoop van producten heeft de consument de mogelijkheid de overeenkomst zonder opgave van redenen te ontbinden gedurende 14 dagen. Deze bedenktermijn gaat in op de dag na ontvangst van het product door de consument of een vooraf door de consument aangewezen en aan de ondernemer bekend gemaakte vertegenwoordiger.</li>
        <li>Tijdens de bedenktijd zal de consument zorgvuldig omgaan met het product en de verpakking. Hij zal het product slechts in die mate uitpakken of gebruiken voor zover dat nodig is om te kunnen beoordelen of hij het product wenst te behouden. Indien hij van zijn herroepingsrecht gebruik maakt, zal hij het product met alle geleverde toebehoren en - indien redelijkerwijze mogelijk - in de originele staat en verpakking aan de ondernemer retourneren, conform de door de ondernemer verstrekte redelijke en duidelijke instructies.</li>
        <li>Wanneer de consument gebruik wenst te maken van zijn herroepingsrecht is hij verplicht dit binnen 14 dagen, na ontvangst van het product, kenbaar te maken aan de ondernemer. Het kenbaar maken dient de consument te doen middels het modelformulier of door middel van een ander communicatiemiddel zoals per e-mail. Nadat de consument kenbaar heeft gemaakt gebruik te willen maken van zijn herroepingsrecht dient de klant het product binnen 14 dagen retour te sturen. De consument dient te bewijzen dat de geleverde zaken tijdig zijn teruggestuurd, bijvoorbeeld door middel van een bewijs van verzending.</li>
        <li>Indien de klant na afloop van de in lid 2 en 3 genoemde termijnen niet kenbaar heeft gemaakt gebruik te willen maken van zijn herroepingsrecht resp. het product niet aan de ondernemer heeft teruggezonden, is de koop een feit.</li>
    </ol>
    <p><i>Bij levering van diensten:</i></p>
    <ol>
        <li>Bij levering van diensten heeft de consument de mogelijkheid de overeenkomst zonder opgave van redenen te ontbinden gedurende ten minste 14 dagen, ingaande op de dag van het aangaan van de overeenkomst.</li>
        <li>Om gebruik te maken van zijn herroepingsrecht, zal de consument zich richten naar de door de ondernemer bij het aanbod en/of uiterlijk bij de levering ter zake verstrekte redelijke en duidelijke instructies.</li>
    </ol>

    <h3>Artikel 7 - Kosten in geval van herroeping</h3>
    <ol>
        <li>De consument draagt de rechtstreekse kosten van het terugzenden van het product..</li>
        <li>Indien de consument een bedrag betaald heeft, zal de ondernemer dit bedrag zo spoedig mogelijk, doch uiterlijk binnen 14 dagen na herroeping, terugbetalen. Hierbij is wel de voorwaarde dat het product reeds terug ontvangen is door de webwinkelier of sluitend bewijs van complete terugzending overlegd kan worden. Terugbetaling zal geschieden via de zelfde betaalmethode die door de consument is gebruikt tenzij de consument nadrukkelijk toestemming geeft voor een andere betaalmethode.</li>
        <li>Bij beschadiging van het product door onzorgvuldige omgang door de consument zelf is de consument aansprakelijk voor eventuele waardevermindering van het product.</li>
        <li>De consument kan niet aansprakelijk worden gesteld voor waardevermindering van het product wanneer door de ondernemer niet alle wettelijk verplichte informatie over het herroepingsrecht is verstrekt, dit dient te gebeuren voor het sluiten van de koopovereenkomst.</li>
    </ol>

    <h3>Artikel 8 - Uitsluiting herroepingsrecht</h3>
    <ol>
        <li>De ondernemer kan het herroepingsrecht van de consument uitsluiten voor producten zoals omschreven in lid 2 en 3. De uitsluiting van het herroepingsrecht geldt slechts indien de ondernemer dit duidelijk in het aanbod, althans tijdig voor het sluiten van de overeenkomst, heeft vermeld.</li>
        <li>Uitsluiting van het herroepingsrecht is slechts mogelijk voor producten: die door de ondernemer tot stand zijn aangebracht overeenkomstig specificaties van de consument; die duidelijk persoonlijk van aard zijn; die door hun aard niet kunnen worden teruggezonden; die snel kunnen bederven of verouderen; waarvan de prijs gebonden is aan schommelingen op de financiële markt waarop de ondernemer geen invloed heeft; voor losse kranten en tijdschriften; voor audio- en video-opnamen en computersoftware waarvan de consument de verzegeling heeft verbroken; voor hygiënische producten waarvan de consument de verzegeling heeft verbroken.</li>
        <li>Uitsluiting van het herroepingsrecht is slechts mogelijk voor diensten: betreffende logies, vervoer, restaurantbedrijf of vrijetijdsbesteding te verrichten op een bepaalde datum of tijdens een bepaalde periode; waarvan de levering met uitdrukkelijke instemming van de consument is begonnen voordat de bedenktijd is verstreken; betreffende weddenschappen en loterijen.</li>
    </ol>

    <h3>Artikel 9 - De prijs</h3>
    <ol>
        <li>Gedurende de in het aanbod vermelde geldigheidsduur worden de prijzen van de aangeboden producten en/of diensten niet verhoogd, behoudens prijswijzigingen als gevolg van veranderingen in btw-tarieven.</li>
        <li>In afwijking van het vorige lid kan de ondernemer producten of diensten waarvan de prijzen gebonden zijn aan schommelingen op de financiële markt en waar de ondernemer geen invloed op heeft, met variabele prijzen aanbieden. Deze gebondenheid aan schommelingen en het feit dat eventueel vermelde prijzen richtprijzen zijn, worden bij het aanbod vermeld.</li>
        <li>Prijsverhogingen binnen 3 maanden na de totstandkoming van de overeenkomst zijn alleen toegestaan indien zij het gevolg zijn van wettelijke regelingen of bepalingen.</li>
        <li>Prijsverhogingen vanaf 3 maanden na de totstandkoming van de overeenkomst zijn alleen toegestaan indien de ondernemer dit bedongen heeft en: deze het gevolg zijn van wettelijke regelingen of bepalingen; of de consument de bevoegdheid heeft de overeenkomst op te zeggen met ingang van de dag waarop de prijsverhoging ingaat.</li>
        <li>De in het aanbod van producten of diensten genoemde prijzen zijn inclusief btw.</li>
        <li>Alle prijzen zijn onder voorbehoud van druk – en zetfouten. Voor de gevolgen van druk – en zetfouten wordt geen aansprakelijkheid aanvaard. Bij druk – en zetfouten is de ondernemer niet verplicht het product volgens de foutieve prijs te leveren.</li>
    </ol>

    <h3>Artikel 10 - Conformiteit en garantie</h3>
    <ol>
        <li>De ondernemer staat er voor in dat de producten en/of diensten voldoen aan de overeenkomst, de in het aanbod vermelde specificaties, aan de redelijke eisen van deugdelijkheid en/of bruikbaarheid en de op de datum van de totstandkoming van de overeenkomst bestaande wettelijke bepalingen en/of overheidsvoorschriften. Indien overeengekomen staat de ondernemer er tevens voor in dat het product geschikt is voor ander dan normaal gebruik.</li>
        <li>Een door de ondernemer, fabrikant of importeur verstrekte garantie doet niets af aan de wettelijke rechten en vorderingen die de consument op grond van de overeenkomst tegenover de ondernemer kan doen gelden.</li>
        <li>Op alle producten is de wettelijke garantie van toepassing. De duur van de wettelijke garantie kan verschillen op basis van de aard van het product.</li>
        <li>Eventuele gebreken of verkeerd geleverde producten dienen binnen 2 maanden na ontdekking schriftelijk aan de ondernemer te worden gemeld.</li>
        <li>De garantie geldt niet indien: de consument de geleverde producten zelf heeft gerepareerd en/of bewerkt of door derden heeft laten repareren en/of bewerken; de geleverde producten aan abnormale omstandigheden zijn blootgesteld of anderszins onzorgvuldig worden behandeld of in strijd zijn met de aanwijzingen van de ondernemer en/of op de verpakking behandeld zijn; de ondeugdelijkheid geheel of gedeeltelijk het gevolg is van voorschriften die de overheid heeft gesteld of zal stellen ten aanzien van de aard of de kwaliteit van de toegepaste materialen.</li>
    </ol>

    <h3>Artikel 11 - Levering en uitvoering</h3>
    <ol>
        <li>De ondernemer zal de grootst mogelijke zorgvuldigheid in acht nemen bij het in ontvangst nemen en bij de uitvoering van bestellingen van producten en bij de beoordeling van aanvragen tot verlening van diensten.</li>
        <li>Als plaats van levering geldt het adres dat de consument aan het bedrijf kenbaar heeft gemaakt.</li>
        <li>Met inachtneming van hetgeen hierover in lid 4 van dit artikel is vermeld, zal het bedrijf geaccepteerde bestellingen met bekwame spoed doch uiterlijk binnen 30 dagen uitvoeren, een bezorging vertraging ondervindt, of indien een bestelling niet dan wel slechts gedeeltelijk kan worden uitgevoerd, ontvangt de consument hiervan uiterlijk 30 dagen nadat hij de bestelling geplaatst heeft bericht. De consument heeft in dat geval het recht om de overeenkomst zonder kosten te ontbinden. De consument heeft geen recht op een contractuele schadevergoeding.</li>
        <li>Alle levertermijnen zijn indicatief. Aan eventuele genoemde termijnen kan de consument geen rechten ontlenen. Overschrijding van een termijn geeft de consument geen recht op contractuele schadevergoeding.</li>
        <li>In geval van ontbinding conform het lid 3 van dit artikel zal de ondernemer het bedrag dat de consument betaald heeft zo spoedig mogelijk, doch uiterlijk binnen 14 dagen na ontbinding, terugbetalen.</li>
        <li>Indien levering van een besteld product onmogelijk blijkt te zijn, zal de ondernemer zich inspannen om een vervangend artikel beschikbaar te stellen. Uiterlijk bij de bezorging zal op duidelijke en begrijpelijke wijze worden gemeld dat een vervangend artikel wordt geleverd. Bij vervangende artikelen kan het herroepingsrecht niet worden uitgesloten. De kosten van een eventuele retourzending zijn voor rekening van de ondernemer.</li>
        <li>Het risico van beschadiging en/of vermissing van producten berust bij de ondernemer tot het moment van bezorging aan de consument of een vooraf aangewezen en aan de ondernemer bekend gemaakte vertegenwoordiger, tenzij uitdrukkelijk anders is overeengekomen.</li>
    </ol>

    <h3>Artikel 12 - Duurtransacties: duur, opzegging en verlenging</h3>
    <p><i>Opzegging</i></p>
    <ol>
        <li>De consument kan een overeenkomst die voor onbepaalde tijd is aangegaan en die strekt tot het geregeld afleveren van producten (elektriciteit daaronder begrepen) of diensten, te allen tijde opzeggen met inachtneming van daartoe overeengekomen opzeggingsregels en een opzegtermijn van ten hoogste één maand.</li>
        <li>De consument kan een overeenkomst die voor bepaalde tijd is aangegaan en die strekt tot het geregeld afleveren van producten (elektriciteit daaronder begrepen) of diensten, te allen tijde tegen het einde van de bepaalde duur opzeggen met inachtneming van daartoe overeengekomen opzeggingsregels en een opzegtermijn van ten hoogste één maand.</li>
        <li>De consument kan de in de vorige leden genoemde overeenkomsten: te allen tijde opzeggen en niet beperkt worden tot opzegging op een bepaald tijdstip of in een bepaalde periode; tenminste opzeggen op dezelfde wijze als zij door hem zijn aangegaan; altijd opzeggen met dezelfde opzegtermijn als de ondernemer voor zichzelf heeft bedongen.</li>
    </ol>
    <p><i>Verlenging</i></p>
    <ol>
        <li>Een overeenkomst die voor bepaalde tijd is aangegaan en die strekt tot het geregeld afleveren van producten (elektriciteit daaronder begrepen) of diensten, mag niet stilzwijgend worden verlengd of vernieuwd voor een bepaalde duur.</li>
        <li>In afwijking van het vorige lid mag een overeenkomst die voor bepaalde tijd is aangegaan en die strekt tot het geregeld afleveren van dag- nieuws- en weekbladen en tijdschriften stilzwijgend worden verlengd voor een bepaalde duur van maximaal drie maanden, als de consument deze verlengde overeenkomst tegen het einde van de verlenging kan opzeggen met een opzegtermijn van ten hoogste één maand.</li>
        <li>Een overeenkomst die voor bepaalde tijd is aangegaan en die strekt tot het geregeld afleveren van producten of diensten, mag alleen stilzwijgend voor onbepaalde duur worden verlengd als de consument te allen tijde mag opzeggen met een opzegtermijn van ten hoogste één maand en een opzegtermijn van ten hoogste drie maanden in geval de overeenkomst strekt tot het geregeld, maar minder dan eenmaal per maand, afleveren van dag-, nieuws- en weekbladen en tijdschriften.</li>
        <li>Een overeenkomst met beperkte duur tot het geregeld ter kennismaking afleveren van dag-, nieuws- en weekbladen en tijdschriften (proef- of kennismakingsabonnement) wordt niet stilzwijgend voortgezet en eindigt automatisch na afloop van de proef- of kennismakingsperiode.</li>
    </ol>
    <p><i>Duur</i></p>
    <ol>
        <li>Als een overeenkomst een duur van meer dan een jaar heeft, mag de consument na een jaar de overeenkomst te allen tijde met een opzegtermijn van ten hoogste een maand opzeggen, tenzij de redelijkheid en billijkheid zich tegen opzegging vóór het einde van de overeengekomen duur verzetten.</li>
    </ol>

    <h3>Artikel 13 - Betaling</h3>
    <ol>
        <li>Voor zover niet anders is overeengekomen, dienen de door de consument verschuldigde bedragen te worden voldaan binnen 7 werkdagen na het ingaan van de bedenktermijn als bedoeld in artikel 6 lid 1. In geval van een overeenkomst tot het verlenen van een dienst, vangt deze termijn aan nadat de consument de bevestiging van de overeenkomst heeft ontvangen.</li>
        <li>De consument heeft de plicht om onjuistheden in verstrekte of vermelde betaalgegevens onverwijld aan de ondernemer te melden.</li>
        <li>In geval van wanbetaling van de consument heeft de ondernemer behoudens wettelijke beperkingen, het recht om de vooraf aan de consument kenbaar gemaakte redelijke kosten in rekening te brengen.</li>
    </ol>

    <h3>Artikel 14 - Klachtenregeling</h3>
    <ol>
        <li>De ondernemer beschikt over een voldoende bekend gemaakte klachtenprocedure en behandelt de klacht overeenkomstig deze klachtenprocedure.</li>
        <li>Klachten over de uitvoering van de overeenkomst moeten binnen 2 maanden volledig en duidelijk omschreven worden ingediend bij de ondernemer, nadat de consument de gebreken heeft geconstateerd.</li>
        <li>Bij de ondernemer ingediende klachten worden binnen een termijn van 14 dagen gerekend vanaf de datum van ontvangst beantwoord. Als een klacht een voorzienbaar langere verwerkingstijd vraagt, wordt door de ondernemer binnen de termijn van 14 dagen geantwoord met een bericht van ontvangst en een indicatie wanneer de consument een meer uitvoerig antwoord kan verwachten.</li>
        <li>Indien de klacht niet in onderling overleg kan worden opgelost ontstaat een geschil dat vatbaar is voor de geschillenregeling.</li>
        <li>Bij klachten dient een consument zich allereerst te wenden tot de ondernemer. Indien de webwinkel is aangesloten bij WebwinkelKeur en bij klachten die niet in onderling overleg opgelost kunnen worden dient de consument zich te wenden tot WebwinkelKeur (www.webwinkelkeur.nl), deze zal gratis bemiddelen. Controleer of deze webwinkel een lopend lidmaatschap heeft via https://www.webwinkelkeur.nl/ledenlijst/. Mocht er dan nog niet tot een oplossing gekomen worden, heeft de consument de mogelijkheid om zijn klacht te laten behandelen door de door WebwinkelKeur aangestelde onafhankelijke geschillencommissie, de uitspraak hiervan is bindend en zowel ondernemer als consument stemmen in met deze bindende uitspraak. Aan het voorleggen van een geschil aan deze geschillencommissie zijn kosten verbonden die door de consument betaald dienen te worden aan de betreffende commissie.</li>
        <li>Een klacht schort de verplichtingen van de ondernemer niet op, tenzij de ondernemer schriftelijk anders aangeeft.</li>
        <li>Indien een klacht gegrond wordt bevonden door de ondernemer, zal de ondernemer naar haar keuze of de geleverde producten kosteloos vervangen of repareren.</li>
    </ol>

    <h3>Artikel 15 - Geschillen</h3>
    <ol>
        <li>Op overeenkomsten tussen de ondernemer en de consument waarop deze algemene voorwaarden betrekking hebben, is uitsluitend Nederlands recht van toepassing. Ook indien de consument woonachtig is in het buitenland.</li>
        <li>Het Weens Koopverdrag is niet van toepassing.</li>
    </ol>

    <h3>Artikel 16 - Aanvullende of afwijkende bepalingen</h3>
    <p>Aanvullende dan wel van deze algemene voorwaarden afwijkende bepalingen mogen niet ten nadele van de consument zijn en dienen schriftelijk te worden vastgelegd dan wel op zodanige wijze dat deze door de consument op een toegankelijke manier kunnen worden opgeslagen op een duurzame gegevensdrager.</p>
  `;

  return (
    <main className="max-w-[1440px] mx-auto px-5 lg:px-0 py-10 lg:py-20">
      <h1 className="text-3xl lg:text-4xl font-bold mb-6 text-[#1C2630]">Algemene Voorwaarden</h1>
      
      <div 
        className="prose max-w-none text-[#1C2630] 
          prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-4
          prose-p:mb-4 prose-p:leading-relaxed
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:space-y-2
          prose-li:pl-2
          prose-b:font-bold"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}
