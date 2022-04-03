import { FunctionalComponent, h } from "preact";
import { Route, Router } from "preact-router";
import { APP_BASE } from "../constants";
import NotFound from "../routes/NotFound";
import QuoteFinder from "../routes/QuoteFinder";

const App: FunctionalComponent = () => {
  return (
    <div class="container">
      <Router>
        <Route path={`${APP_BASE}/`} component={QuoteFinder} />
        <NotFound default />
      </Router>
    </div>
  );
};

export default App;
