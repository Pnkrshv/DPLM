import { useState } from "react";
import "./Selections.css";

export default function Selections() {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("parameters");

  return (
    <>
      {isWindowOpen && (
        <>
          <div className="window-bg"></div>
          <div className="modal-window">
            <div className="window-navigation">
              <div className="nav-elements">
                <div
                  className="tab-indicator"
                  style={{
                    transform:
                      activeTab === "data"
                        ? "translateX(0%)"
                        : "translateX(190%)",
                    width: activeTab === "data" ? "50%" : "35%",
                  }}
                ></div>
                <div
                  className={`nav-element ${activeTab === "data" ? "activeTab" : ""}`}
                  onClick={() => {
                    setActiveTab("data");
                  }}
                >
                  Данные выборки
                </div>
                <div
                  className={`nav-element ${activeTab === "parameters" ? "activeTab" : ""}`}
                  onClick={() => {
                    setActiveTab("parameters");
                  }}
                >
                  Параметры
                </div>
              </div>
              <div
                className="close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsWindowOpen(false);
                }}
              >
                <svg
                  width="32px"
                  height="32px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <g clip-path="url(#clip0_429_11083)">
                      {" "}
                      <path
                        d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006"
                        stroke="#292929"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{" "}
                    </g>{" "}
                    <defs>
                      {" "}
                      <clipPath id="clip0_429_11083">
                        {" "}
                        <rect width="24" height="24" fill="white"></rect>{" "}
                      </clipPath>{" "}
                    </defs>{" "}
                  </g>
                </svg>{" "}
              </div>
            </div>
            <div className="window-settings"></div>

            <div className="window-content">
              {activeTab === "parameters" && (
                <>
                  <form method="post" className="parameters-form">
                    <label>Название выборки</label>
                    <input type="text" />
                    <label>Тип выборки</label>
                    <select>
                      <option disabled selected>Выбрать</option>
                      <option>Выборка 1</option>
                      <option>Выборка 2</option>
                    </select>
                  </form>
                </>
              )}

              {activeTab === "data" && (
                <>
                  <p>data</p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="buttons">
        <button
          className="create-btn"
          onClick={() => {
            setIsWindowOpen(true);
          }}
        >
          <p>Создать выборку</p>
        </button>
        <button className="update-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
            <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
          </svg>
        </button>
      </div>
    </>
  );
}
