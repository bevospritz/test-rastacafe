const handleConfirmModal = () => {
    const dataToSend = [];

    // Controllo per selezionare i lotti
    if (selectedLots.length === 0) {
      alert("Nessun lotto selezionato. Per favore seleziona almeno un lotto.");
      return;
    }

    // Costruisci i dati da inviare in base alle condizioni
    if (isWashed) {
      if (isFiltered) {
        const bigDryVolume = Math.round((dryVolume * dryFiltered) / 100);
        const dryVolumeAfterFilter = Math.round(dryVolume - bigDryVolume);

        dataToSend.push({
          name: document.querySelector("#bigDryPatio").value,
          volume: bigDryVolume,
          type: "BigDry",
          patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
        });

        dataToSend.push({
          name: document.querySelector("#dryPatio").value,
          volume: dryVolumeAfterFilter,
          type: "Dry",
          patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
        });
      } else {
        dataToSend.push({
          name: document.querySelector("#dryPatio").value,
          volume: dryVolume,
          type: "Dry",
          patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
        });
      }

      if (isDepulped) {
        dataToSend.push({
          name: document.querySelector("#cdPatio").value,
          volume: cdVolume,
          type: "CD",
          patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
        });

        dataToSend.push({
          name: document.querySelector("#greenPatio").value,
          volume: greenVolumeAfterDepulp,
          type: isDepulpedGreen ? "CDGreen" : "Green",
          patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
        });
      }

      const generalType = isWashed ? "WashedNatural" : "Natural";

      if (!isFiltered && !isDepulped) {
        dataToSend.push({
          name: document.querySelector("#dryPatio").value,
          volume: dryVolume,
          type: generalType,
          patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
        });
      }
    } else {
      dataToSend.push({
        name: document.querySelector("#naturalPatio").value,
        volume: totalVolume,
        type: "Natural",
        patio_nLot: selectedLots.length > 0 ? selectedLots[0].patio_nLot : null,
      });
    }

    // Primo endpoint: salviamo i dati principali nella tabella patio
    axios
      .post("http://localhost:5000/api/patio", dataToSend)
      .then((response) => {
        console.log("Risposta dal server:", response.data);

        if (!response.data.patioIds) {
          console.error("patioIds non trovato nella risposta");
          alert("Errore nella risposta dal server. Per favore riprova.");
          return;
        }

        alert("Dati inviati con successo!");

        // Log dei dati prima del filtro
        console.log("newLots:", newLots);
        console.log("selectedLots:", selectedLots);

        // Filtra i lotti selezionati utilizzando il campo id
        const updatedLots = newLots.filter((lot) =>
          selectedLots.some((selLot) => selLot.id === lot.id)
        );

        console.log("Lotti aggiornati:", updatedLots);

        // Secondo endpoint: aggiorna il campo "worked" nella tabella newlot per ciascun lotto
        const updateLotsPromises = updatedLots.map(async (lot) => {
          console.log(`Aggiornamento del lotto con ID: ${lot.id}`);

          try {
            const response = await axios.patch(
              `http://localhost:5000/api/newlot/${lot.id}`,
              { worked: 1 }
            );
            console.log(`Lotto con ID ${lot.id} aggiornato:`, response.data);
          } catch (error) {
            console.error(
              `Errore nell'aggiornamento del lotto con ID ${lot.id}:`,
              error
            );
          }
        });

        // **Quarto endpoint: aggiungere dati in patio_prevnlot**
        const patioIds = response.data.patioIds;
        console.log("patioIds:", patioIds);
        const patioPrevNlotData = updatedLots.map((lot, index) => ({
          patio_id: patioIds[index], // Associare l'ID della tabella patio
          prev_nLot_newlot: lot.newlot_nLot, // Numero del lotto selezionato
        }));
        console.log("patioPrevNlotData:", patioPrevNlotData);

        axios
          .post("http://localhost:5000/api/patio_prevnlot", patioPrevNlotData)
          .then(() => console.log("Dati patio_prevnlot inseriti con successo"))
          .catch((error) =>
            console.error("Errore nell'inserimento in patio_prevnlot:", error)
          );

        // Attendi il completamento di tutte le richieste di aggiornamento dei lotti
        Promise.all(updateLotsPromises).then(() => {
          // Aggiorna lo stato dei lotti se necessario
          setNewLots((prevLots) =>
            prevLots.map((lot) =>
              selectedLots.some((selLot) => selLot.id === lot.id)
                ? { ...lot, worked: 1 }
                : lot
            )
          );
        });

        setIsModalOpen(false); // Chiudi il modal
      })
      .catch((error) => {
        console.error("Errore nell'invio dei dati:", error);
        alert("Errore nell'invio dei dati. Per favore, riprova.");
      });
  };