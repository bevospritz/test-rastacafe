const handleSubmitStart = async (e) => {
    e.preventDefault();

    // ✅ STEP 2: PREPARO PAYLOAD per /api/dryer (come farà il POST)
    const fermentationPayload = {
      volume,
      date,
      timeIn,
      method,
      lots: selectedLots.map((lot) => ({
        prev_nLot_patio: lot.prev_nLot_patio,
      })),
    };

    try {
      // ✅ POST dryer
      const response = await axios.post(
        "http://localhost:5000/api/fermentation",
        fermentationPayload
      );

      const fermentationData = await fermentationResponse.json();
      console.log("Fermentazione creata:", fermentationData);

      // ✅ PATCH patio
      try {
        const patchPayload = {
          lots: selectedLots.map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round(
              (lotVolumes[lot.id] / 100) * getDisplayVolume(lot)
            ),
          })),
        };

        const patchRes = await axios.patch(
          "http://localhost:5000/api/patio/update-lots",
          patchPayload
        );

        console.log("PATCH ok:", patchRes.data);
      } catch (error) {
        console.error(
          "Errore PATCH:",
          error.response ? error.response.data : error.message
        );
      }

      alert("Dryer salvato e lotti aggiornati con successo!");
      // Qui puoi fare reset se serve: setSelectedLots([]), resetForm, ecc.
    } catch (err) {
      console.error(
        "Errore POST /api/dryer:",
        err.response ? err.response.data : err.message
      );
      alert("Errore durante il salvataggio.");
    }

    navigate("/dashboard/traceability/manage-lot");
  };