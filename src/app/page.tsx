"use client";

import React, { useState, useEffect } from "react";
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
  const [companies, setCompanies] = useState([]);
  const [intialSearchPressed, setIntialSearchPressed] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<any>([]);
  const [selectedForm, setSelectedForm] = useState("");
  const [results, setResults] = useState([]);
  const [apiError, setApiError] = useState<any>("");
  const [searchInput, setSearchInput] = useState("");
  const [fetchingTable, setFetchingTable] = useState(false);
  const [forms, setForms] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [resetPagination, setResetPagination] = useState(false);
  const [pagedInfo, setPagedInfo] = useState({
    pageSize: allowedPageSizePerBatch,
    pageNumber: 0,
    loadMoreResults: false,
  });

  useEffect(() => {
    const getForms = async () => {
      try {
        const formsData = await fetchForms();
        setForms(formsData);
        setApiError("");
      } catch (error: any) {
        setApiError(error);
      }
    };
    getForms();
  }, []);

  useEffect(() => {
    if (searchInput.length > 1) {
      const debounceTimer = setTimeout(async () => {
        try {
          const companyList = await fetchCompanies(searchInput);
          setCompanies(companyList);
          setApiError("");
        } catch (error) {
          if (error instanceof Error) {
            setApiError(error.message);
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
    if (selectedCompanies.length === 0 || !selectedForm) return;

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
      setApiError("");
      pageNumber === 0 && isSearchBtn && setResetPagination(false);
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
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

  return (
    <div className="container">
      <div className="dropdown-container">
        <div className="multi-select-container">
          <div className="selected-companies">
            {selectedCompanies.map((company: { Name: string; CIK: number }) => (
              <div key={company.CIK} className="pill" title={company.Name}>
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
                  <li key={index} onClick={() => handleCompanySelect(company)}>
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
            onChange={(e) => setSelectedForm(e.target.value)}
            value={selectedForm}
          >
            <option className="select-list" value="">
              Select Form
            </option>
            {forms.map((form: { Id: string; Name: string }) => (
              <option key={form.Id} value={form.Id}>
                {form.Name}
              </option>
            ))}
          </select>
          <button
            className="searchBtn"
            disabled={
              fetchingTable || !selectedCompanies.length || !selectedForm.length
            }
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
            <p>{apiError?.message}</p>
          </div>
        </div>
      )}

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
