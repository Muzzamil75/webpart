"use client";

import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import {
  fetchForms,
  fetchCompanies,
  fetchSearchResults,
  allowedPageSizePerBatch,
} from "./apiService";
import { useConfig } from "./useConfig";
import PaginatedTable from "./PaginatedTable";

const AppWrapper = () => {
  const { config, isLoading, isError } = useConfig();
  if (isLoading) {
    return <div className="launch-div blinking">Loading configs ...</div>;
  }
  if (isError) return <div className="launch-div">Error loading configs !</div>;
  else if (!isError && !isLoading) return <App />;
};

const App = () => {
  const dropdownRef = useRef(null);
  const requestIdRef = useRef(0);
  const [forms, setForms] = useState([]);
  const [results, setResults] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [apiError, setApiError] = useState<any>({});
  const [searchInput, setSearchInput] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedForm, setSelectedForm] = useState({});
  const [fetchingTable, setFetchingTable] = useState(false);
  const [resetPagination, setResetPagination] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<any>([]);
  const [intialSearchPressed, setIntialSearchPressed] = useState(false);
  const [pagedInfo, setPagedInfo] = useState({
    pageSize: allowedPageSizePerBatch,
    pageNumber: 0,
    loadMoreResults: false,
  });

  useEffect(() => {
    const getForms = async () => {
      try {
        const formsData = await fetchForms();
        const groupForms = formsData.formsGroups.map((f) => ({
          ...f,
          type: "group",
        }));

        const otherForms = formsData.forms.map((f) => ({
          ...f,
          type: "individual",
        }));
        setForms([...groupForms, ...otherForms]);
        setApiError({});
      } catch (error: any) {
        apiMessageHandler(error);
      }
    };
    getForms();
  }, []);

  const apiMessageHandler = (error: any) => {
    if (error.status === 401) {
      setApiError({ message: "Unauthorized access", status: 401 });
    } else {
      setApiError({
        message: error.message || "An unknown error occurred",
        status: error.status || "",
      });
    }
  };

  useEffect(() => {
    if (searchInput.length > 1) {
      const currentRequestId = ++requestIdRef.current;
      const debounceTimer = setTimeout(async () => {
        try {
          const companyList = await fetchCompanies(searchInput);
          if (currentRequestId === requestIdRef.current) {
            setCompanies(companyList);
            setApiError({});
          }
        } catch (error) {
          if (error instanceof Error) {
            apiMessageHandler(error);
          } else {
            setApiError("An unknown error occurred");
          }
        }
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setCompanies([]);
    }
  }, [searchInput]);

  const handleCompanyChange = (e: any) => {
    !fetchingTable && setSearchInput(e.target.value);
  };

  const handleCompanySelect = (company: any) => {
    if (
      !selectedCompanies.some((c: { CIK: string }) => c.CIK === company.CIK)
    ) {
      setSelectedCompanies([...selectedCompanies, company]);
    }
    setSearchInput("");
    setCompanies([]);
  };

  const removeCompany = (CIK: number) => {
    setSelectedCompanies(
      selectedCompanies.filter((company: any) => company.CIK !== CIK)
    );
  };

  const fetchData = async (pageNumber = 0, isSearchBtn = false) => {
    setFetchingTable(true);
    pageNumber === 0 && isSearchBtn && setResetPagination(true);
    try {
      const response = await fetchSearchResults(
        selectedCompanies,
        selectedForm,
        pageNumber,
        pagedInfo.pageSize
      );
      setResults(response.SearchOutput || []);
      setTotalRecords(response.TotalRecords || 0);
      setPagedInfo((prev) => ({ ...prev, pageNumber }));
      setApiError({});
      pageNumber === 0 && isSearchBtn && setResetPagination(false);
    } catch (error) {
      if (error instanceof Error) {
        apiMessageHandler(error);
      } else {
        setApiError("An unknown error occurred");
      }
    } finally {
      setFetchingTable(false);
    }
  };

  const onSearchButtonClick = async () => {
    setIntialSearchPressed(true);
    fetchData(0, true);
  };

  const onResetButtonClick = () => {
    setSelectedCompanies([]);
    setSelectedForm("");
    setResults([]);
    setTotalRecords(0);
    setPagedInfo({
      pageSize: allowedPageSizePerBatch,
      pageNumber: 0,
      loadMoreResults: false,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setSearchInput("");
        setCompanies([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="container">
      <div className="dropdown-container">
        <div className="multi-select-container" ref={dropdownRef}>
          <div className="selected-companies">
            {selectedCompanies.map((company: { Name: string; CIK: number }) => (
              <div
                key={company.CIK}
                className="pill"
                title={`${company.Name}   ${company.CIK}`}
              >
                {company.Name.length > 18
                  ? company.Name.slice(0, 18) + " ..."
                  : company.Name}
                <a onClick={() => !fetchingTable && removeCompany(company.CIK)}>
                  ×
                </a>
              </div>
            ))}
            <div className="input-wrapper">
              <input
                className="input-field"
                placeholder="Search companies..."
                value={searchInput}
                onChange={handleCompanyChange}
              />
            </div>
          </div>
          {companies.length > 0 && (
            <ul className="dropdown-list">
              {companies.map(
                (company: { Name: string; CIK: number }, index) => (
                  <li
                    className={
                      selectedCompanies?.some((c) => c.CIK === company.CIK)
                        ? "selectedComp"
                        : ""
                    }
                    key={index}
                    onClick={() => handleCompanySelect(company)}
                  >
                    {`${company.Name} (${company.CIK})`}
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <div className="inlineStyle">
          <select
            disabled={fetchingTable}
            onChange={(e) => {
              const [type, id] = e.target.value.split("-");
              const selected = forms.find(
                (form: any) => form.Id.toString() === id && form.type === type
              );
              setSelectedForm(selected || {});
            }}
            value={
              selectedForm?.type && selectedForm?.Id
                ? `${selectedForm.type}-${selectedForm.Id}`
                : ""
            }
          >
            <option className="select-list" value="">
              All Forms
            </option>
            {forms.map(
              (form: { Id: string; type: string; Name: string }, _index) => (
                <option
                  // className={selectedForm == form.Id ? "selectedComp" : ""}
                  key={_index}
                  value={`${form.type}-${form.Id}`}
                >
                  {form.Name}
                </option>
              )
            )}
          </select>
          <button
            className="searchBtn"
            disabled={fetchingTable}
            onClick={onSearchButtonClick}
          >
            {fetchingTable ? <span className="loader"></span> : "Search"}
          </button>
          {fetchingTable && (
            <div className="info-div">
              <strong className={fetchingTable ? "blinking" : ""}>
                {"Fetching..."}
              </strong>{" "}
            </div>
          )}
        </div>
        {/* <button
            disabled={fetchingTable}
            className="searchBtn resetBtn"
            onClick={onResetButtonClick}
          >
            Reset
          </button> */}
      </div>
      {apiError?.message && (
        <div className="flex-row">
          <div className="flex-col">
            <p className="error-text">{apiError?.message}</p>
          </div>
        </div>
      )}

      {!apiError.message && (
        <PaginatedTable
          results={results}
          totalRecords={totalRecords}
          fetchData={fetchData}
          resetPagination={resetPagination}
          selectedCompanies={selectedCompanies}
          selectedForm={selectedForm}
          fetchingTable={fetchingTable}
          intialSearchPressed={intialSearchPressed}
        />
      )}

      <footer>
        <p className="align-center">
          Powered by{" "}
          <img
            alt="Logo"
            className="logo"
            src="https://www.intelligize.com/wp-content/uploads/2023/01/intelligize-logo.svg"
          />
        </p>
      </footer>
    </div>
  );
};

export default AppWrapper;
