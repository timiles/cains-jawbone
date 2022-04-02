import { FunctionalComponent, h } from "preact";
import { Route, Router } from "preact-router";
import NotFound from "../routes/NotFound";
import QuoteFinder from "../routes/QuoteFinder";

const App: FunctionalComponent = () => {
  return (
    <div class="container">
      <Router>
        <Route path="/" component={QuoteFinder} />
        <NotFound default />
      </Router>
    </div>
  );
};

export default App;
