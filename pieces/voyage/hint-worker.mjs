// Works out a solution away from the page, so asking for a hint never freezes the game.
import { Chapter } from './chapter.mjs';
import { chapters } from './chapters/index.mjs';
self.onmessage = ({ data }) => {
  const model = new Chapter(chapters[data.id]);
  model.where = data.where; model.active = data.active; model.mechs = data.mechs; model.items = new Set(data.items); model.root = data.root;
  self.postMessage({ ticket: data.ticket, key: model.key(), moves: model.solve() });
};
