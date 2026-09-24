import { applyMicroprism } from "microprism-glass";
import { Pane } from "tweakpane";

const canvas = document.querySelector("#fx");
const imagePath = `${import.meta.env.BASE_URL}assets/demo.jpg`;

if (!canvas) {
  throw new Error("Canvas element #fx not found");
}

const fx = applyMicroprism(canvas, imagePath, {
  prismSize: 24,
  focus: 0,
  prismContrast: 50,
});

const pane = new Pane({
  title: "Microprism Controls",
  expanded: true,
});

pane.addBinding(fx.getParams(), "prismSize", {
  label: "Prism Size",
  min: 4,
  max: 32,
  step: 1,
}).on("change", (ev) => {
  fx.setParams({ prismSize: ev.value });
});

pane.addBinding(fx.getParams(), "focus", {
  label: "Focus",
  min: 0,
  max: 100,
  step: 1,
}).on("change", (ev) => {
  fx.setParams({ focus: ev.value });
});

pane.addBinding(fx.getParams(), "prismContrast", {
  label: "Contrast",
  min: 0,
  max: 100,
  step: 1,
}).on("change", (ev) => {
  fx.setParams({ prismContrast: ev.value });
});

// Кнопка сброса к дефолтным значениям
pane.addButton({ title: "Reset Defaults" }).on("click", () => {
  // Получаем текущие параметры, чтобы обновить GUI
  const current = fx.getParams();
  
  // Сбрасываем внутренние значения объекта params в Tweakpane
  // (Tweakpane хранит ссылку на объект, поэтому мутация работает)
  Object.assign(current, {
    prismSize: 24,
    focus: 0,
    prismContrast: 50,
  });
  
  // Применяем новые параметры к эффекту
  fx.setParams(current);
  
  // Обновляем положение ползунков в интерфейсе
  pane.refresh();
});