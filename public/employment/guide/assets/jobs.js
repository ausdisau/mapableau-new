const byId = (id) => document.getElementById(id);
const search = byId("role-search");
const setting = byId("setting");
const roles = Array.from(document.querySelectorAll("article.role"));

function filterRoles() {
  const words = search.value.trim().toLocaleLowerCase("en-AU").split(/\s+/).filter(Boolean);
  let count = 0;
  for (const role of roles) {
    const description = role.textContent.toLocaleLowerCase("en-AU");
    role.hidden = Boolean(setting.value && role.dataset.setting !== setting.value)
      || !words.every((word) => description.includes(word));
    if (!role.hidden) count += 1;
  }
  byId("role-count").textContent = count === 0
    ? "No role guides match. Try another skill or clear the filters."
    : `${count} example ${count === 1 ? "role" : "roles"} shown`;
}
byId("filters").hidden = false;
search.addEventListener("input", filterRoles);
setting.addEventListener("change", filterRoles);
byId("clear-filters").addEventListener("click", () => {
  search.value = "";
  setting.value = "";
  filterRoles();
  search.focus();
});
filterRoles();

const form = byId("planner-form");
const draft = byId("draft");
const status = byId("copy-status");
const replace = byId("replace");
let previousTemplate = "";
form.hidden = false;
form.addEventListener("submit", (event) => event.preventDefault());
function template() {
  const choices = [...form.querySelectorAll("input:checked")].map((choice) => choice.value);
  if (!choices.length) return "";
  const list = new Intl.ListFormat("en-AU", { style: "long", type: "conjunction" }).format(choices);
  return `Hello,\n\nFor my interview, I would like to ${list}. Could you let me know what you can arrange?\n\nThank you.`;
}
function useSelections() {
  previousTemplate = template();
  draft.value = previousTemplate;
  replace.hidden = true;
  status.textContent = "Your draft has been updated.";
}
form.addEventListener("change", (event) => {
  if (!event.target.matches("input[type=checkbox]")) return;
  if (!draft.value.trim() || draft.value === previousTemplate) {
    useSelections();
  } else {
    replace.hidden = false;
    status.textContent = "Your edits are still in the message. You can replace them with your selected requests.";
  }
});
replace.addEventListener("click", useSelections);
form.addEventListener("reset", () => {
  previousTemplate = "";
  replace.hidden = true;
  status.textContent = "Your interview planner has been cleared.";
});
byId("copy").addEventListener("click", async () => {
  if (!draft.value.trim()) {
    status.textContent = "Choose a request or write a message first.";
    draft.focus();
    return;
  }
  try {
    await navigator.clipboard.writeText(draft.value);
    status.textContent = "Message copied. You choose who receives it.";
  } catch {
    draft.focus();
    draft.select();
    status.textContent = "Your message is selected. Use your device’s Copy command.";
  }
});

// Keep signed-in handoffs on the current deployment when MapAble serves this guide.
if (location.pathname === "/employment/guide/index.html") {
  for (const link of document.querySelectorAll("a[data-mapable]")) {
    const target = new URL(link.href);
    link.href = target.pathname + target.search + target.hash;
  }
}
