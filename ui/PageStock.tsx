import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { useFind } from "meteor/react-meteor-data";
import { opacify } from "polished";
import React, { ReactNode, useState } from "react";
import { isUserAdmin } from "../api/accounts";
import Stocks, { StockID } from "../api/stocks";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import { getCorrectTextColor } from "../util";
import PageStockItem from "./PageStockItem";

export const Modal = ({
  children,
  onDismiss,
}: {
  children: ReactNode | ReactNode[];
  onDismiss?: () => void;
}) => {
  const currentCamp = useCurrentCamp();
  return (
    <div
      onClick={onDismiss}
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${currentCamp &&
        opacify(-0.25, getCorrectTextColor(currentCamp.color))};
        z-index: 665;
      `}
    >
      <div
        className={css`
          background-color: ${currentCamp &&
          getCorrectTextColor(currentCamp.color)};
          box-shadow: 0 0 24px
            ${currentCamp &&
            opacify(-0.25, getCorrectTextColor(currentCamp.color, true))};
          padding: 8px 8px;
          border-radius: 8px;
          position: relative;
          z-index: 667;
        `}
        onClick={(e) => {
          //  e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
};
const NEW = Symbol("New");
export default function PageStock() {
  const user = useCurrentUser();
  const [removeStock] = useMethod("Stock.removeStock");
  const [showRemoved] = useState(false);
  const [isEditing, setIsEditing] = useState<null | StockID | typeof NEW>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);

  const stocks = useFind(
    () =>
      Stocks.find(
        { removedAt: { $exists: showRemoved } },
        { sort: sortBy ? { [sortBy]: 1 } : { updatedAt: -1, createdAt: -1 } },
      ),
    [showRemoved, sortBy],
  );

  return (
    <div>
      <button onClick={() => setIsEditing(NEW)}>Create Stock</button>
      {isEditing === NEW ? (
        <Modal>
          <PageStockItem onCancel={() => setIsEditing(null)} />
        </Modal>
      ) : isEditing ? (
        <Modal>
          <PageStockItem
            onCancel={() => setIsEditing(null)}
            stock={stocks.find(({ _id }) => _id === isEditing)}
          />
        </Modal>
      ) : null}
      <select
        onChange={(event) => setSortBy(event.target.value || undefined)}
        value={sortBy}
      >
        <option value={""}>Sort By...</option>
        {stocks[0]
          ? Object.keys(stocks[0]).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))
          : null}
      </select>
      <hr />
      <div
        className={css`
          overflow-x: auto;
        `}
      >
        <table
          className={css`
            width: 100%;
          `}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock._id}>
                <td>{stock.name}</td>
                <td>
                  {stock.unitSize}
                  {stock.sizeUnit}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => setIsEditing(stock._id)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  {stock && isUserAdmin(user) && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete " + stock.name,
                          )
                        ) {
                          removeStock({ stockId: stock._id });
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
