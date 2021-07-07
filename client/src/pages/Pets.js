import React from "react";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/react-hooks";

import client from "../client";
import PetBox from "../components/PetBox";
import NewPet from "../components/NewPet";
import Loader from "../components/Loader";

const PET_DETAILS = gql`
  fragment PetDetails on Pet {
    id
    type
    name
    img
    new @client
  }
`;

const GET_PETS = gql`
  query petsList($input: PetsInput) {
    pets(input: $input) {
      ...PetDetails
    }
  }
  ${PET_DETAILS}
`;

const CREATE_PET = gql`
  mutation CreatePet($input: NewPetInput!) {
    addPet(input: $input) {
      ...PetDetails
    }
  }
  ${PET_DETAILS}
`;

export default function Pets() {
  const [modal, setModal] = React.useState(false);
  const pets = useQuery(GET_PETS);

  const [createPet, newPet] = useMutation(CREATE_PET, {
    update(cache, { data: { addPet }, errors }) {
      if (!errors) {
        const { pets } = cache.readQuery({ query: GET_PETS });
        cache.writeQuery({
          query: GET_PETS,
          data: { pets: [{ ...addPet, new: true }, ...pets] },
        });
      }
    },
  });

  if (pets.loading) return <Loader />;
  if (pets.error || newPet.error) return <p>ERROR</p>;

  const { pets: petsFromCache } = client.readQuery({
    query: GET_PETS,
  });
  console.log("Pets from cache", petsFromCache);

  const createFast = () => {
    client.writeQuery({
      query: GET_PETS,
      data: {
        pets: [
          ...petsFromCache,
          {
            id: `Pet - nr.${Math.random()}`,
            img: "https://placedog.net/300/300",
            name: "Pet created by write query",
            type: "DOG",
            new: true,
            __typename: "Pet",
          },
        ],
      },
    });
  };

  const onSubmit = (input) => {
    setModal(false);
    console.log(input)
    createPet({
      variables: { input },
      optimisticResponse: {
        __typename: "Mutation",
        addPet: {
          __typename: "Pet",
          id: Math.round(Math.random() * -1000000) + "",
          type: input.type,
          name: input.name,
          img: "https://via.placeholder.com/300",
          new: true,
        },
      },
    });
  };

  const petsList = pets.data.pets.map((pet) => (
    <div className="col-xs-12 col-md-4 col" key={pet.id}>
      <div className="box">
        {pet.new && (
          <p
            style={{
              textDecoration: "uppercase",
              color: "blue",
              fontSize: "1.2em",
            }}
          >
            NEW
          </p>
        )}
        <PetBox pet={pet} />
      </div>
    </div>
  ));

  if (modal) {
    return (
      <div className="row center-xs">
        <div className="col-xs-8">
          <NewPet onSubmit={onSubmit} onCancel={() => setModal(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <div className="row">{petsList}</div>
        <button style={{ marginLeft: "13px" }} onClick={createFast}>
          Add pet using write query
        </button>
      </section>
    </div>
  );
}
