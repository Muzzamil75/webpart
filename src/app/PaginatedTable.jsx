import React, { useEffect, useState } from "react";
import "./styles.css";
import WORD_ICON from "./Icons/Word";
import PDF_ICON from "./Icons/PDF";
import { allowedPageSizePerBatch, downloadFile } from "./apiService";

const PaginatedTable = ({
  results,
  totalRecords,
  fetchData,
  selectedCompanies,
  selectedForm,
  fetchingTable,
  resetPagination,
  intialSearchPressed
}) => {
  const [pageNumber, setPageNumber] = useState(0);
  const [paginationStart, setPaginationStart] = useState(0);
  const [loadingButtons, setLoadingButtons] = useState({});
  const pageSize = allowedPageSizePerBatch;
  const maxPageButtons = 5;
  const totalPages = Math.ceil(totalRecords / pageSize);

  useEffect(() => {
    if (resetPagination) {
      setPageNumber(0);
      setPaginationStart(0);
    }
  }, [resetPagination]);

  const handlePageChange = (newPage) => {
    if (fetchingTable) return;
    if (newPage >= 0 && newPage < totalPages) {
      setPageNumber(newPage);
      fetchData(newPage);
    }
  };

  const handlePrevBatch = () => {
    if (fetchingTable) return;
    if (paginationStart > 0) {
      setPaginationStart(paginationStart - maxPageButtons);
    }
  };

  const handleNextBatch = () => {
    if (fetchingTable) return;
    if (paginationStart + maxPageButtons < totalPages) {
      setPaginationStart(paginationStart + maxPageButtons);
    }
  };

  const handleDownloadFile = (item, format) => {
    if (fetchingTable) return;

    const key = `${item?.FilingInfo?.FilingId}-${format}`;
    setLoadingButtons((prev) => ({ ...prev, [key]: true }));

    downloadFile({
      documentId: `d${item?.FilingInfo?.FilingId}`,
      filingId: `d${item?.FilingInfo?.FilingId}`,
      companyName: item?.FilingInfo?.CompanyName,
      fileFormat: format,
    }).finally(() => {
      setLoadingButtons((prev) => ({ ...prev, [key]: false }));
    });
  };

  const startRecord = pageNumber * pageSize + 1;
  const endRecord = Math.min(startRecord + pageSize - 1, totalRecords);

  return (
    <div className="flex-row">
      <div className="flex-col">
        {results?.length > 0 ? (
          <>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Filing Date</th>
                  <th>Form</th>
                  <th>Company Name</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={index}>
                    <td>{item?.FilingInfo?.FilingDate}</td>
                    <td>{item?.FilingInfo?.FormWithDescription}</td>
                    <td>{item?.FilingInfo?.CompanyName}</td>
                    <td>
                      <button
                        className="download-button"
                        onClick={() => handleDownloadFile(item, "pdf")}
                        disabled={
                          loadingButtons[`${item?.FilingInfo?.FilingId}-pdf`]
                        }
                      >
                        <PDF_ICON
                          loading={
                            loadingButtons[`${item?.FilingInfo?.FilingId}-pdf`]
                          }
                        />
                      </button>
                      &nbsp;&nbsp;
                      <button
                        className="download-button"
                        onClick={() => handleDownloadFile(item, "docx")}
                        disabled={
                          loadingButtons[`${item?.FilingInfo?.FilingId}-docx`]
                        }
                      >
                        <WORD_ICON
                          loading={
                            loadingButtons[`${item?.FilingInfo?.FilingId}-docx`]
                          }
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              className="tableHeadings"
              style={{ opacity: fetchingTable ? 0.5 : 1 }}
            >
              <p>
                <strong>{"Showing:"}</strong>{" "}
                {startRecord === endRecord
                  ? startRecord
                  : `${startRecord} to ${endRecord}`}
                {!resetPagination && (
                  <>
                    {" "}
                    (of <strong>{totalRecords}</strong> Records)
                  </>
                )}
              </p>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="arrow-button"
                  onClick={handlePrevBatch}
                  disabled={paginationStart === 0}
                >
                  &laquo;
                </button>
                {Array.from(
                  {
                    length: Math.min(
                      maxPageButtons,
                      totalPages - paginationStart
                    ),
                  },
                  (_, i) => (
                    <button
                      key={paginationStart + i}
                      className={`page-button ${
                        pageNumber === paginationStart + i ? "active" : ""
                      }`}
                      disabled={
                        !selectedForm?.length || !selectedCompanies?.length
                      }
                      onClick={() => handlePageChange(paginationStart + i)}
                    >
                      {paginationStart + i + 1}
                    </button>
                  )
                )}
                <button
                  className="arrow-button"
                  onClick={handleNextBatch}
                  disabled={paginationStart + maxPageButtons >= totalPages}
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        ) : selectedCompanies.length && intialSearchPressed && selectedForm.length && !results.length && !fetchingTable ? (
          <p className="align-center">No results found</p>
        ) : null}
      </div>
    </div>
  );
};

export default PaginatedTable;
