import { useEffect, useState } from "react";
import "./App.css";
import firebase from "./firestore";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import axios from "axios";
import moment from "moment";
import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Highlight,
  connectHits,
} from "react-instantsearch-dom";

const db = firebase.firestore();
const searchClient = algoliasearch(
  "CXLC6HNNXB",
  "1d458805bfa7587bdb408a6e3e082c2c"
);

const index = searchClient.initIndex("beerIndex");

const re1 = ""; // /(.*?(-|,).*?)(-|,).*/; // remove hyphen/comma
const re2 = ""; // /([^()]*)/g; //remove brackets
const re3 = ""; ///[.*]/g; //remove brackets
const re4 = /bottle/gi; //remove word bottle/can and dot
const re5 = /(d+(.d+)?[MCDNPF]?L(s+d+PK)?)/gi; // remove ml
// const re6 = /d+% ?/g; //remove percent
const re6 = /( ?)(?:(?:d+.d+)|(?:.d+)|(?:d+))%( ?)/g;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  paper: {
    padding: theme.spacing(2),
    // textAlign: "center",
    color: theme.palette.text.secondary,
  },
}));

const addUntappdId = (shopBeerId, mergedData) => {
  const prom1 = axios
    .post("https://api.crafty.camp/apis/add.php", {
      ...mergedData,
      shopBeerId,
    })
    .then((a) => {
      console.log("done1", a);
      axios
        .post("https://api.crafty.camp/apis/listone.php", {
          beerId: mergedData.bid,
          brewId: mergedData.brewery.brewery_id,
        })
        .then((a) => console.log("done2", a))
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));

  return axios.all([prom1]);
};

const excludeFromApp = (itemId) => {
  return axios.post("https://api.crafty.camp/apis/exclude.php", {
    shopBeerId: itemId,
  });
};

const autoExcludeFromApp = (itemId) => {
  // return axios.post("https://api.crafty.camp/apis/exclude.php", {
  //   shopBeerId: itemId,
  // });
};

const InputVals = ({
  itemVals,
  slicePoint,
  setSlicePoint,
  loadBeersPls,
  setApiRemaning,
}) => {
  const beerInfo = {
    ...itemVals,
    handle:
      itemVals.shopId.search("-") > 0
        ? "/" + itemVals.handle
        : "/products/" + itemVals.handle,
    id: itemVals.shopId,
  };

  const beerDescriptionParsed = beerInfo.body_html;
  const [brewName, setBrewName] = useState(beerInfo.vendor);
  const [abv, setAbv] = useState();
  const [beerName, setBeerName] = useState(beerInfo.title);
  const [beerDescription, setBeerDescription] = useState(beerDescriptionParsed);
  const [untappdBeerId, setUntappdBeerId] = useState("");
  const [untappdBrewId, setUntappdBrewId] = useState("");
  const [untappdData, setUntappdData] = useState();
  const [mergedData, setMergedData] = useState([]);
  const [beerCacheFireStore, setBeerCacheFirestore] = useState([]);
  const [error, setError] = useState("");
  const [loadingFirestore, setLoadingFirestore] = useState(true);
  const searchURL = `https://api.crafty.camp/apis/ut.php?q=${
    brewName +
    " " +
    beerName
      .replace(brewName + " ", "")
      .slice(0, Math.round(beerName.replace(brewName + " ", "").length / 2))
  }`;

  const researchEmail = (critera) => {
    const searchURL = `https://api.crafty.camp/apis/ut.php?q=${critera}`;

    axios
      .get(searchURL, {
        // headers: { "User-Agent": "The Crafty: Shop Matcher Service" },
      })
      .then((response) => {
        console.log(response);
        if (response.data.meta.code == 429) {
          setError(response.data.meta.code);
        } else {
          setApiRemaning(response.data.xratelimitremaining);
          setUntappdData(response.data);
        }
      })
      .catch((error) => {
        console.log("errr", error);
        // setError(error.response.status);
      });
  };

  useEffect(() => {
    const fetchBeer = () =>
      axios
        .get(searchURL)
        .then((response) => {
          setUntappdData(response.data);
          console.log(response.data);
          // untappdData && untappdData.response.beers.count === 1 && setUntappdBeerId(untappdData.response.beers.items[0].beer.bid);
          // untappdData && untappdData.response.beers.count === 1 && setUntappdBrewId(untappdData.response.beers.items[0].brewery.brewery_id);
          // untappdData && untappdData.response.beers.count === 1 && setAbv(untappdData.response.beers.items[0].beer.beer_abv);
          // untappdData && untappdData.response.beers.count === 1 && setBeerDescription(untappdData.response.beers.items[0].beer.beer_description);
          // untappdData && untappdData.response.beers.count === 1 && setBeerName(untappdData.response.beers.items[0].beer.beer_name);
          // untappdData && untappdData.response.beers.count === 1 && setBrewName(untappdData.response.beers.items[0].brewery.brewery_name);
          // untappdData && untappdData.response.beers.count === 1 && setMergedData({ ...untappdData.response.beers.items[0].beer, brewery: untappdData.response.beers.items[0].brewery, rating_count: -1, addedToCrafty: firebase.firestore.Timestamp.fromDate(new Date()), craftyInStock: true,});
        })
        .catch((error) => {
          console.log(error.response.status);
          setError(error.response.status);
        });
    // fetchBeer();
  }, []);

  console.log(beerInfo, "bi");
  const classes = useStyles();
  return (
    <div>
      {error && (
        <Paper style={{ backgroundColor: "red" }} className={classes.paper}>
          ERROR, try again later {error === 429 && "rate limited"}
        </Paper>
      )}
      <Paper className={classes.paper}>
        {!loadingFirestore &&
          beerCacheFireStore
            .filter((p) =>
              String(p.brewery.brewery_name)
                .toLocaleLowerCase()
                .startsWith(brewName.toLocaleLowerCase())
            )
            .sort((a, b) => a.beer_name.localeCompare(b.beer_name))
            .map((item, i) => {
              return (
                <Button
                  variant="contained"
                  color="secondary"
                  style={{ margin: 5 }}
                  key={item.bid}
                  onClick={() => {
                    console.log(123, item);
                    setUntappdBeerId(item.bid);
                    setUntappdBrewId(item.brewery.brewery_id);
                    setAbv(item.beer_abv);
                    setBeerDescription(item.beer_description);
                    setBeerName(item.beer_name);
                    setBrewName(item.brewery.brewery_name);
                    setMergedData({
                      ...item,
                      brewery: item.brewery,
                      addedToCrafty: firebase.firestore.Timestamp.fromDate(
                        new Date()
                      ),
                    });
                  }}
                >
                  {item.beer_name}
                </Button>
              );
            })}
        <InstantSearch indexName={"beerIndex"} searchClient={searchClient}>
          <SearchBox
            defaultRefinement={beerName
              .replace(re1, "")
              .replace(re2, "")
              .replace(re3, "")
              .replace(re4, "")
              .replace(re5, "")
              .replace(re6, "")}
          />
          <CustomHits
            setUntappdBeerId={setUntappdBeerId}
            setUntappdBrewId={setUntappdBrewId}
            setAbv={setAbv}
            setBeerDescription={setBeerDescription}
            setBeerName={setBeerName}
            setBrewName={setBrewName}
            setMergedData={setMergedData}
          />
        </InstantSearch>

        {untappdData &&
          untappdData.response.beers.count !== 0 &&
          untappdData.response.beers.items
            .sort((a, b) => a.beer.beer_name.localeCompare(b.beer.beer_name))
            .map((item, i) => (
              <Button
                variant="contained"
                color="primary"
                style={{ margin: 5 }}
                // key={beerInfo.id + i}
                onClick={() => {
                  setUntappdBeerId(item.beer.bid);
                  setUntappdBrewId(item.brewery.brewery_id);
                  setAbv(item.beer.beer_abv);
                  setBeerDescription(item.beer.beer_description);
                  setBeerName(item.beer.beer_name);
                  setBrewName(item.brewery.brewery_name);
                  setMergedData({
                    ...item.beer,
                    brewery: item.brewery,
                    addedToCrafty: firebase.firestore.Timestamp.fromDate(
                      new Date()
                    ),
                  });
                }}
              >
                {item.beer.beer_name}
              </Button>
            ))}
      </Paper>
      <br />
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          addUntappdId(beerInfo.id, mergedData)
            .then((response) => {
              console.log(response);
              loadBeersPls();
            })
            .catch((error) => {
              console.log(error);
            });
        }}
        disabled={untappdBeerId === "" || untappdBrewId === "" || !abv}
      >
        add to crafty
      </Button>
      <Button>
        <a href={"https://" + beerInfo.shop + beerInfo.handle}>Visit shop</a>
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={() =>
          researchEmail(
            brewName + " " + beerName.replace(brewName + " ", "")
            // .slice(0, Math.round(beerName.replace(brewName + " ", "").length / 2))
          )
        }
      >
        Search Untappd
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={() => loadBeersPls()}
      >
        Skip Beer
      </Button>
      <br />
      <br />
      <br />
      <br />
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          excludeFromApp(beerInfo.id)
            .then((response) => {
              console.log(response);
              loadBeersPls();
            })
            .catch((error) => {
              console.log(error);
            });
        }}
      >
        Exculde from appearing
      </Button>
      <TextField
        style={{ width: "100%" }}
        placeholder={"untappd Beer id"}
        onChange={(e) => setUntappdBeerId(e.target.value)}
        value={untappdBeerId}
        disabled
      />
      <br />
      <TextField
        style={{ width: "100%" }}
        placeholder={"untappd Brew id"}
        onChange={(e) => setUntappdBrewId(e.target.value)}
        value={untappdBrewId}
        disabled
      />
      <br />
      <TextField
        style={{ width: "100%" }}
        placeholder={"Beer Name"}
        onChange={(e) => setBeerName(e.target.value)}
        value={beerName
          .replace(re1, "")
          .replace(re2, "")
          .replace(re3, "")
          .replace(re4, "")
          .replace(re5, "")
          .replace(re6, "")}
      />
      <br />
      <TextField
        style={{ width: "100%" }}
        placeholder={"Brew Name"}
        onChange={(e) => setBrewName(e.target.value)}
        value={brewName}
      />
      <br />
      <TextField
        style={{ width: "100%" }}
        placeholder={"ABV"}
        onChange={(e) => setAbv(e.target.value)}
        value={abv}
      />
      <br />
      <TextField
        style={{ width: "100%" }}
        multiline
        value={beerDescription}
        onChange={(e) => setBeerDescription(e.target.value)}
        disabled
      />
    </div>
  );
};

function App() {
  const [allBeers, setAllBeers] = useState([]);
  const [slicePoint, setSlicePoint] = useState(0);
  const [beersLeftToAdd, setBeersLeftToAdd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiRemaining, setApiRemaning] = useState(null);

  const classes = useStyles();

  const loadBeersPls = () => {
    setAllBeers([]);
    axios
      .get("https://api.crafty.camp/apis/waiting.php", {
        // headers: { "User-Agent": "The Crafty: Shop Matcher Service" },
      })
      .then((response) => {
        console.log(response.data.data);
        setAllBeers(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get("https://api.crafty.camp/apis/monitor.php", {
        // headers: { "User-Agent": "The Crafty: Shop Matcher Service" },
      })
      .then((response) => {
        setBeersLeftToAdd(+(response.data.match(/queue[^,]*?(d+)/) || [])[1]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    loadBeersPls();
  }, []);

  const filteredItems = allBeers
    // .filter((x) => x.excluded === false)
    // .filter((x) => x.untappdBeerId === -1)
    // .filter((x) => x.available === true)
    // .sort((b, a) => a.craftyLastUpdated.localeCompare(b.craftyLastUpdated))
    .slice(slicePoint, slicePoint + 1);

  console.log(filteredItems);

  const beersInApp = allBeers
    .filter((x) => x.excluded === false)
    .filter((x) => x.variants[0].available === true)
    .filter((x) => x.untappdBeerId !== -1);

  const remainingB = allBeers;
  // .filter((x) => x.excluded === false)
  // .filter((x) => x.variants[0].available === true)
  // .filter((x) => x.untappdBeerId === -1);

  return (
    <div className="App">
      <div className={classes.root}>
        {filteredItems.map((item, i) => {
          return (
            <Grid key={item.id} container spacing={3}>
              <Grid item xs>
                <Paper className={classes.paper}>
                  <img
                    src={item.images.length > 0 && item.images[0].src}
                    height={100}
                    alt="crap"
                  />
                  <div>To Add: {beersLeftToAdd}</div>
                  <div>
                    api remaning:{" "}
                    {apiRemaining ? apiRemaining : "not searched yet"}
                  </div>
                  <div>api refresh time: </div>
                </Paper>
              </Grid>
              <Grid item xs>
                <Paper className={classes.paper}>
                  <div>
                    <h3>{item.title}</h3>
                    <h3>{item.vendor}</h3>
                    <h4>£{item.price}</h4>
                    <div
                      style={{
                        backgroundColor:
                          item.body_html &&
                          item.body_html.toLowerCase().includes("wine")
                            ? "red"
                            : "white",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.body_html }}
                    ></div>
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={8}>
                <InputVals
                  setApiRemaning={setApiRemaning}
                  style={{ width: "100%" }}
                  itemVals={item}
                  slicePoint={slicePoint}
                  loadBeersPls={loadBeersPls}
                  setSlicePoint={setSlicePoint}
                />
              </Grid>
            </Grid>
          );
        })}
        {loading && <div>Loading</div>}
        {!loading && filteredItems.length === 0 && <div>All up to date</div>}
      </div>
    </div>
  );
}

const CustomHits = connectHits((props) => {
  const {
    setUntappdBeerId,
    setUntappdBrewId,
    setAbv,
    setBeerDescription,
    setBeerName,
    setBrewName,
    setMergedData,
    hits,
  } = props;
  return hits.map((item, i) => {
    return (
      <Button
        variant="contained"
        color="secondary"
        style={{ margin: 5 }}
        onClick={() => {
          setUntappdBeerId(item.bid);
          setUntappdBrewId(item.brewery.brewery_id);
          setAbv(item.beer_abv);
          setBeerDescription(item.beer_description);
          setBeerName(item.beer_name);
          setBrewName(item.brewery.brewery_name);
          setMergedData({
            ...item,
            brewery: item.brewery,
          });
        }}
      >
        {item.beer_name} - {item.brewery.brewery_name}
      </Button>
    );
  });
});

export default App;
