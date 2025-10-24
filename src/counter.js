export function setupCounter(element) {
  // Estado inmutable: representado por un objeto que no se muta directamente
  let state = { counter: 0 };

  const render = (s) => {
    element.innerHTML = `count is ${s.counter}`;
  };

  const setState = (nextState) => {
    state = { ...state, ...nextState };
    render(state);
  };

  element.addEventListener('click', () => {
    setState({ counter: state.counter + 1 });
  });

  render(state);
}
