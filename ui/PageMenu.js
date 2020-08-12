import { endOfHour, isPast, min, setHours, startOfHour } from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import Camps from "../api/camps";
import Products from "../api/products";
import Sales from "../api/sales";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";

function SparkLine({
  data,
  strokeWidth = 1,
  stroke = "transparent",
  fill = "yellow",
  ...props
}) {
  console.log(data);
  const viewBoxWidth = 1000;
  const viewBoxHeight = 5;

  const pathD = useMemo(() => {
    if (data.length) {
      const xOffset = -1;
      const yOffset = viewBoxHeight;
      let minX, maxX, minY, maxY;
      for (let [x, y] of data) {
        if (!minX || x < minX) minX = x;
        if (!maxX || x > maxX) maxX = x;
        if (!minY || y < minY) minY = y;
        if (!maxY || y > maxY) maxY = y;
      }
      const XDelta = maxX - minX;
      const YDelta = maxY - minY;
      let dataPoints = data
        .map(([x, y]) => {
          let xNext = xOffset + ((x - minX) / XDelta) * (viewBoxWidth + 1);
          let yNext = yOffset - ((y - minY) / YDelta) * viewBoxHeight;
          return ["L", xNext, yNext].join(" ");
        })
        .join(" ");
      const firstPoint = `L ${xOffset} ${viewBoxHeight}`;
      const lastPoint = `L ${xOffset + (viewBoxWidth + 1)} ${viewBoxHeight}`;
      return `M ${xOffset} ${yOffset} ${firstPoint} ${dataPoints} ${lastPoint}`;
    }
  }, [data]);

  return (
    <svg
      width="100%"
      height="5"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="none"
      {...props}
    >
      {pathD && (
        <path d={pathD} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      )}
    </svg>
  );
}

const rolloverOffset = 4;

export default function PageMenu() {
  const currentDate = new Date();
  const {
    data: [currentCamp],
    loading: campsLoading,
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const from = useMemo(
    () =>
      startOfHour(
        setHours(
          isPast(currentCamp?.start)
            ? currentCamp?.start
            : currentCamp?.buildup,
          rolloverOffset,
        ),
      ),
    [currentCamp],
  );
  console.log(endOfHour(currentDate));
  const to = useMemo(
    () =>
      endOfHour(min(setHours(currentCamp?.end, rolloverOffset), currentDate)),
    [currentCamp, currentDate],
  );
  const {
    location = {},
    loading: locationLoading,
    error,
  } = useCurrentLocation();
  console.log({ from, to });
  const { data: sales, loading: salesLoading } = useMongoFetch(
    Sales.find({ timestamp: { $gte: from, $lte: to } }),
    [from, to],
  );
  const { data: products, loading: productsLoading } = useMongoFetch(
    Products.find(
      {
        removedAt: { $exists: false },
        locationIds: { $elemMatch: { $eq: location._id } },
      },
      { sort: { brandName: 1, name: 1 } },
    ),
    [location._id],
  );
  console.log(products);
  const productsGroupedByTags = useMemo(
    () =>
      Object.entries(
        products.reduce((memo, product) => {
          const key = [...(product.tags || [])].sort()?.join(",") || "other";
          if (memo[key]) {
            memo[key].push(product);
          } else {
            memo[key] = [product];
          }
          return memo;
        }, []),
      ),
    [products],
  );
  const randomIndex = Math.floor(
    Math.random() * (productsGroupedByTags.length - 1),
  );

  if (productsLoading || locationLoading) return "Loading...";
  if (error) return error;
  console.log(sales);
  return (
    <div
      className={css`
        display: flex;
        padding: 16px;
        font-size: 1.25em;
        /*height: 100%;
        max-height: 100%;*/
        font-family: monospace;
        letter-spacing: -1px;
        flex-wrap: wrap;
      `}
    >
      {productsGroupedByTags
        .sort((a, b) => a[0].localeCompare(b[0]))
        //        .sort((a, b) => b[1].length - a[1].length)
        .map(([tags, products], i) => {
          const productsByBrandName = Object.entries(
            products.reduce((m, product) => {
              if (m[product.brandName]) {
                m[product.brandName].push(product);
              } else {
                m[product.brandName] = [product];
              }
              return m;
            }, {}),
          ).sort(([, a], [, b]) => b.length - a.length);
          console.log(tags);
          return (
            <>
              <div
                key={tags}
                className={css`
                  -webkit-column-break-inside: avoid;
                  page-break-inside: avoid;
                  break-inside: avoid;
                  border: 3px solid #ffed00;
                  margin: 5px;
                  padding: 4px;
                  flex: 32% 0;
                `}
              >
                <h3
                  className={css`
                    margin: 0;
                    padding: 8px;
                  `}
                >
                  {tags?.join?.(", ") || tags}
                </h3>
                <ul
                  className={css`
                    margin: 0;
                    padding: 0;
                    list-style: none;
                  `}
                >
                  {productsByBrandName.map(([brandName, products]) => (
                    <li
                      key={brandName}
                      className={css`
                        margin: 0;
                        padding: 4px 6px;
                        display: flex;
                        flex-direction: column;
                        background: rgba(255, 255, 255, 0.1);
                        margin-top: 4px;
                        align-items: stretch;
                        -webkit-column-break-inside: avoid;
                        page-break-inside: avoid;
                        break-inside: avoid;
                      `}
                    >
                      <small
                        className={css`
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                        `}
                      >
                        <span>{brandName}</span>
                        <small>HAX</small>
                      </small>
                      {products.map((product) => (
                        <div key={product._id}>
                          <div
                            className={css`
                              flex: 1;
                              display: flex;
                              justify-content: space-between;
                            `}
                          >
                            <span>
                              <div
                                className={css`
                                  font-weight: 500;
                                `}
                              >
                                {product.name}
                              </div>
                              <small
                                className={css`
                                  margin-top: -0.5em;
                                  display: block;
                                `}
                              >
                                {[
                                  product.description || null,
                                  product.unitSize && product.sizeUnit
                                    ? `${product.unitSize}${product.sizeUnit}`
                                    : null,
                                  typeof product.abv === "number" ||
                                  (typeof product.abv === "string" &&
                                    product.abv)
                                    ? `${product.abv}%`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .map((thing, i) => (
                                    <React.Fragment key={thing}>
                                      {i > 0 ? ", " : null}
                                      <small key={thing}>{thing}</small>
                                    </React.Fragment>
                                  ))}
                              </small>
                            </span>
                            <b>{product.salePrice}</b>
                          </div>
                          <SparkLine
                            className={css`
                              margin-top: -20px;
                              border-bottom: yellow 1px solid;
                            `}
                            data={Object.entries(
                              sales.reduce((memo, sale) => {
                                const count = sale.products.filter(
                                  (saleProduct) =>
                                    saleProduct._id === product._id,
                                ).length;
                                if (count) {
                                  const key = ~~(sale.timestamp / 3600000);
                                  memo[key] = (memo[key] || 0) + count;
                                }
                                console.log(memo);
                                return memo;
                              }, {}),
                            ).map(([x, y]) => [+x, y])}
                          />
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
              {i === randomIndex && false ? (
                <div
                  className={css`
                    display: flex;
                    justify-content: center;
                  `}
                >
                  <pre
                    className={css`
                      font-size: 0.7em;
                      opacity: 0.7;
                      line-height: 1;
                      letter-spacing: -2px;
                    `}
                  >
                    TBDTBDTBDTBDTBDTBDTBDTBDTBDTBDTBD
                  </pre>
                </div>
              ) : null}
            </>
          );
        })}
    </div>
  );
}
