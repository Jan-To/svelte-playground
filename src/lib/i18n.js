
import { writable, derived } from 'svelte/store';

export const lang = writable('en');

export const t = derived(lang, $lang => translations[$lang]);

export function setLang(l) {
  lang.set(l);
}

const translations = {
  en: {
    title: "See Beyond the Numbers",
    subtitle: "Watch Your Data Come to Life",
    participants: "PARTICIPANTS",
    lasth: "last h",
    votes: "votes",
    herotitle: "Rather be a superhero or a wizard?",
    maptitle: "Where are you from?",
    drinktitle: "What do you drink?",
    timetraveltitle: "The past or the future?",
    breakfasttitle: "How did you get up today?",
    callforaction: "Become part of this",
    locationquestion: "Where are you from?",
    idolquestion: "Would you rather be a superhero or a wizard?",
    emojiquestion: "What is your favorite emoji?",
    drinkquestion: "What do you like to drink?",
    timetravelquestion: "Would you rather travel to the past or the future?",
    wakeuptimequestion: "When did you get up today?",
    breakfastquestion: "What did you eat for breakfast?",
    breakfastoptions: ["Sweet", "Salty", "Nothing"],
    idoloptions: ["Superhero", "Wizard"],
    timetraveloptions: ["Past", "Future"],
    drinksoptions: ["Coffee", "Tea", "Water", "Juice"],
    emojiplaceholdertext: "Enter an emoji",
    cityplaceholdertext: "Enter a city",
    polltitle: "Visualize Your Data",
    pollbutton: "Submit",
    pop: "pop.",
  },
  de: {
    title: "Sehen und Verstehen",
    subtitle: "Erlebe, wie Daten lebendig werden",
    participants: "TEILNEHMER",
    lasth: "Std",
    votes: "Stimmen",
    herotitle: "Lieber ein Superheld oder ein Zauberer?",
    maptitle: "Woher kommt ihr?",
    drinktitle: "Eure Lieblingsgetränke",
    timetraveltitle: "Vergangenheit vs Zukunft",
    breakfasttitle: "So seid ihr heute aufgestanden",
    callforaction: "Nimm hier teil",
    locationquestion: "Woher kommst du?",
    idolquestion: "Lieber ein Superheld oder ein Zauberer?",
    emojiquestion: "Was ist dein Lieblings-Emoji?",
    drinkquestion: "Was trinkst du gerne?",
    timetravelquestion: "Würdest du lieber in die Vergangenheit oder die Zukunft reisen?",
    wakeuptimequestion: "Wann bist du heute aufgestanden?",
    breakfastquestion: "Was hast du zum Frühstück gegessen?",
    breakfastoptions: ["Süß", "Salzig", "Nichts"],
    idoloptions: ["Superheld", "Zauberer"],
    timetraveloptions: ["Vergangenheit", "Zukunft"],
    drinksoptions: ["Kaffee", "Tee", "Wasser", "Saft"],
    emojiplaceholdertext: "Füge ein Emoji ein",
    cityplaceholdertext: "Wähle eine Stadt",
    polltitle: "Zeige deine Daten an",
    pollbutton: "Teilnehmen",
    pop: "Einwohner",
  },
};