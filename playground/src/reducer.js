import tutorial from "../tutorial.md";
import welcome from "../welcome.md";
import reference from "../reference.md";

const toText = encoded => window.atob(encoded.slice(28));
const guides = {
  welcome: toText(welcome),
  tutorial: toText(tutorial),
  reference: toText(reference),
  empty: "# Empty playground\nAdd some code:\n"
};

export default vm => {
  const initialState = {
    bpm: vm.driver.bpm,
    currentTab: 1,
    tabs: [
      { name: "Welcome", text: guides.welcome },
      { name: "Tutorial", text: guides.tutorial },
      { name: "Reference", text: guides.reference }
    ]
  };

  return function reduce(state = initialState, action) {
    console.log("ACTION", action);
    switch (action.type) {
      case "SET_TEMPO":
        state.bpm = +action.value;
        vm.driver.bpm = state.bpm;
        return state;
      case "SET_TAB":
        state.currentTab = +action.value;
        return state;
      case "NEW_TAB":
        state.tabs.push({ name: "New", text: guides.empty });
        state.currentTab = state.tabs.length - 1;
        return state;
      default:
        return state;
    }
  };
};
