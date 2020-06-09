import React, {useEffect, useState} from 'react'
import { Redirect, Route } from "react-router-dom";
import {
  AdminGuesser,
  ResourceGuesser,
  ListGuesser,
  ShowGuesser,
  CreateGuesser,
  EditGuesser,
  FieldGuesser,
  InputGuesser,
  hydraDataProvider as baseHydraDataProvider,
  hydraSchemaAnalyzer,
  graphqlDataProvider,
  fetchHydra as baseFetchHydra,
} from "@api-platform/admin";
import parseHydraDocumentation from "@api-platform/api-doc-parser/lib/hydra/parseHydraDocumentation";
import { parseGraphQl } from "@api-platform/api-doc-parser";
import { AutocompleteInput, ReferenceField, ReferenceInput, TextField, TextInput } from "react-admin";
import authProvider from "./authProvider";
import Login from "./layout/Login";

const entrypoint = process.env.REACT_APP_API_ENTRYPOINT;

const ReviewsList = (props) => (
  <ListGuesser {...props}>
    <FieldGuesser source="author" />
    <FieldGuesser source="book" />
    {/* Use react-admin components directly when you want complex fields. */}
    {/*<ReferenceField label="Book's title" source="book" reference="books">
      <TextField source="title" />
    </ReferenceField>*/}

    <TextField source="book.title" />

    {/* While deprecated fields are hidden by default, using an explicit FieldGuesser component allows to add them back. */}
    <FieldGuesser source="letter" />
  </ListGuesser>
);

const ReviewsShow = (props) => (
  <ShowGuesser {...props}>
    <FieldGuesser source="author" addLabel={true} />
    <FieldGuesser source="book" addLabel={true} />
    <FieldGuesser source="rating" addLabel={true} />

    {/* While deprecated fields are hidden by default, using an explicit FieldGuesser component allows to add them back. */}
    <FieldGuesser source="letter" addLabel={true} />

    <FieldGuesser source="body" addLabel={true} />
    <FieldGuesser source="publicationDate" addLabel={true} />
  </ShowGuesser>
);

const ReviewsCreate = (props) => (
  <CreateGuesser {...props}>
    <InputGuesser source="author" />
    {/* Use react-admin components directly when you want complex inputs. */}
    <ReferenceInput
      source="book"
      reference="books"
      label="Books"
      filterToQuery={(searchText) => ({ title: searchText })}
    >
      <AutocompleteInput optionText="title" />
    </ReferenceInput>

    <InputGuesser source="rating" />

    {/* While deprecated fields are hidden by default, using an explicit InputGuesser component allows to add them back. */}
    <InputGuesser source="letter" />

    <InputGuesser source="body" />
    <InputGuesser source="publicationDate" />
  </CreateGuesser>
);

const ReviewsEdit = (props) => (
  <EditGuesser {...props}>
    <InputGuesser source="author" />

    {/* Use react-admin components directly when you want complex inputs. */}
    {/*<ReferenceInput
      source="book"
      reference="books"
      label="Books"
      filterToQuery={(searchText) => ({ title: searchText })}
    >
      <AutocompleteInput optionText="title" />
    </ReferenceInput>*/}

    <ReferenceInput
      source="book"
      reference="books"
      label="Books"
      filterToQuery={(searchText) => ({ title: searchText })}
      format={(v) => v['@id'] ?? v}
    >
      <AutocompleteInput optionText="title" />
    </ReferenceInput>

    <InputGuesser source="rating" />

    {/* While deprecated fields are hidden by default, using an explicit InputGuesser component allows to add them back. */}
    <InputGuesser source="letter" />

    <InputGuesser source="body" />
    <InputGuesser source="publicationDate" />
  </EditGuesser>
);

const fetchHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
const fetchHydra = (url, options = {}) =>
  localStorage.getItem("token")
    ? baseFetchHydra(url, {
        ...options,
        headers: new Headers(fetchHeaders()),
      })
    : baseFetchHydra(url, options);
const apiDocumentationParser = (entrypoint) =>
  parseHydraDocumentation(
    entrypoint,
    localStorage.getItem("token")
      ? {
          headers: new Headers(fetchHeaders()),
        }
      : {}
  ).then(
    ({ api }) => ({ api }),
    (result) => {
      // Only useful when the API endpoint is secured
      if (result.status === 401) {
        // Prevent infinite loop if the token is expired
        localStorage.removeItem("token");
        return Promise.resolve({
          api: result.api,
          customRoutes: [
            <Route
              path="/"
              render={() =>
                localStorage.getItem("token") ? (
                  window.location.reload()
                ) : (
                  <Redirect to="/login" />
                )
              }
            />,
          ],
        });
      }
      return Promise.reject(result);
    }
  );
const myDataProvider = baseHydraDataProvider(
  entrypoint,
  fetchHydra,
  apiDocumentationParser,
  //(entrypoint, options) => parseGraphQl(entrypoint + '/graphql', options),
  true
);

export default () => {
  const [dataProvider, setDataProvider] = useState(null);
  //useEffect(() => graphqlDataProvider(entrypoint + '/graphql').then(dataProvider => setDataProvider(dataProvider)), [])
  useEffect(() => setDataProvider(myDataProvider), [])

  if (!dataProvider) {
    return <div>Loading</div>;
  }
  return (
    <React.StrictMode>
      <AdminGuesser
        entrypoint={entrypoint}
        dataProvider={dataProvider}
        schemaAnalyzer={hydraSchemaAnalyzer()}
        authProvider={authProvider}
        loginPage={Login}
      >
          <ResourceGuesser name="books" />
          <ResourceGuesser
            name="reviews"
            list={ReviewsList}
            show={ReviewsShow}
            create={ReviewsCreate}
            edit={ReviewsEdit}
          />
      </AdminGuesser>
    </React.StrictMode>
  );
}
