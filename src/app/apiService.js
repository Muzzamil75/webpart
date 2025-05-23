export const allowedPageSizePerBatch = 10;

const apiFetch = async (url, method, body = null) => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const error = new Error(`HTTP Error: ${response.status}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.body = errorBody;
      throw error;
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const fetchForms = () =>
  apiFetch(window.appConfigs?.FORMS_URL, "GET").then((data) => ({
    forms: data.Forms || [],
    formsGroups: data.FormsGroups,
  }));

export const fetchCompanies = (value) => {
  const payload = {
    Codes: [],
    Filters: {
      ExcludedCodes: [],
      searchType: "Contains",
      value,
      returnTotalRecords: false,
      oneCharacterLogic: true,
      applicationKey: "ad",
      skipCompanyList: true,
    },
    PagedInfo: {
      PageSize: window.appConfigs?.companyPageSize || 10000,
      PageNumber: 1,
    },
    returnTotalRecords: false,
    oneCharacterLogic: true,
  };

  return apiFetch(window.appConfigs?.COMPANIES_URL, "POST", payload).then(
    (data) => data.Companies || []
  );
};

export const fetchSearchResults = (
  selectedCompanies,
  selectedForm,
  pageNumber = 0,
  pageSize = 100
) => {
  const formId = selectedForm?.type === "individual" ? [selectedForm.Id] : [];
  const groupId = selectedForm?.type === "group" ? [selectedForm.Id] : [];

  const payload = {
    app: "sf",
    isReskinApp: true,
    filters: {
      ownershipForms: "EXC",
      searchFor: { values: ["Filings"] },
      CompanyCIK: {
        ids: selectedCompanies.map((company) => company.CIK),
        companyListIds: [],
        searchKeys: [],
        includeNoneUnknown: false,
        mainFiler: false,
      },
      amendmentFilings: "INC",
      ixbrl: "INC",
      sectionType: [],
      includeExhibits: true,
      boilerPlate: {
        status: "INC",
        type: [],
        statusLabel: "Include",
        typeLabel: "All",
      },
    },
    sortInfo: { fieldName: "FilingDate", order: "DESC" },
    pagedInfo: { pageSize, pageNumber, loadMoreResults: false },
    snippetsOptions: {
      shouldIncludeSnippets: false,
      snippetSizeInWords: 6,
      snippetsPerResult: 4,
      shouldIncludeCrossReferences: false,
    },
  };

  if (formId.length || groupId.length) {
    payload.filters.forms = {
      ids: formId,
      groupsIds: groupId,
      SearchLogic: "OR",
    };
  }

  return apiFetch(window.appConfigs?.SEARCH_URL, "POST", payload).then(
    (data) => ({
      SearchOutput: data.SearchOutput || [],
      TotalRecords: data.TotalRecords || 0,
    })
  );
};

export const downloadFile = async ({
  documentId,
  filingId,
  companyName,
  fileFormat,
}) => {
  try {
    const payload = {
      App: "sf",
      ContentInfo: {
        chunkIds: { Ids: null },
        CompanyName: companyName,
        CurrentFilingId: filingId,
        sectionIds: "",
        SummarizeAIOptions: [],
        DocumentId: { Ids: [documentId] },
      },
      SelectedOptions: {
        MergeFiles: true,
        ZipFiles: false,
        Filename: `${companyName}_${
          new Date().toISOString().split("T")[0]
        }_${filingId}.${fileFormat}`,
        HasCoverPage: false,
        HasExhibitCoverPage: false,
        HasSummaryPage: false,
        FileFormat: fileFormat,
        HighlightKeywords: false,
        keywords: "",
        ContentType: "ThisFiling",
        hasAiResults: false,
        includeOriginalText: true,
      },
    };

    const data = await apiFetch(
      window.appConfigs?.DOWNLOAD_URL,
      "POST",
      payload
    );

    if (data && data.URL) {
      window.open(data.URL, "_blank");
    } else {
      throw new Error();
    }
  } catch (error) {
    throw new Error();
  }
};
